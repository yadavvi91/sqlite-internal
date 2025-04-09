import {
  SqliteHeader,
  SqlitePageHeader,
  SqlitePage,
  SqliteTableInteriorPage,
  SqliteCellPointer,
  SqliteTableInteriorCell,
  SqliteDatabase,
  SqliteTableLeafCell,
  SqliteTableLeafPage,
} from "./type";

export function parseHeader(view: DataView): SqliteHeader {
  const header: SqliteHeader = {
    pageSize: view.getUint16(16),
    fileFormatWriteVersion: view.getUint8(18),
    fileFormatReadVersion: view.getUint8(19),
    reservedSpace: view.getUint8(20),
    maxPageSize: view.getUint16(21),
    writeVersion: view.getUint8(23),
    readVersion: view.getUint8(24),
    reservedSpace2: view.getUint8(25),
    pageCount: view.getUint32(28),
    firstFreelistPage: view.getUint32(32),
    totalFreelistPages: view.getUint32(36),
    schemaCookie: view.getUint32(40),
    schemaFormatNumber: view.getUint32(44),
    schemaChangeCounter: view.getUint32(48),
    fileChangeCounter: view.getUint32(52),
  };
  return header;
}

function parsePageHeader(buffer: Uint8Array, offset: number): SqlitePageHeader {
  const pageHeaderView = new DataView(
    buffer.buffer,
    buffer.byteOffset + offset
  );
  const pageType = pageHeaderView.getUint8(0);
  const firstFreeblockOffset = pageHeaderView.getUint16(1);
  const cellCount = pageHeaderView.getUint16(3);
  const cellPointerArrayOffset = pageHeaderView.getUint16(5);
  const fragmentFreeBytes = pageHeaderView.getUint8(7);
  const rightChildPageNumber = pageHeaderView.getUint32(8);

  return {
    pageType,
    firstFreeblockOffset,
    cellCount,
    cellPointerArrayOffset,
    fragmentFreeBytes,
    rightChildPageNumber,
  };
}

function parseVarint(view: DataView, offset: number): [number, number] {
  let value = 0;
  let shift = 0;
  let byte: number;
  let length = 0;

  do {
    byte = view.getUint8(offset + length);
    value += (byte & 0x7f) << shift;
    shift += 7;
    length++;
  } while (byte & 0x80);

  return [value, length];
}

export function parseTableInteriorPage(
  page: SqlitePage
): SqliteTableInteriorPage {
  const { header, pageData } = page;
  const view = new DataView(
    pageData.buffer,
    pageData.byteOffset,
    pageData.byteLength
  );

  // Parsing the cell pointer array
  let ptr = 12 + page.headerOffset;

  const cellPointerArray: SqliteCellPointer[] = new Array(header.cellCount);
  for (let i = 0; i < header.cellCount; i++) {
    cellPointerArray[i] = {
      offset: ptr,
      length: 2,
      content: pageData.subarray(ptr, ptr + 2),
      value: view.getUint16(ptr),
    };

    ptr += 2;
  }

  const unallocatedSpaceStart = ptr;
  const unallocatedSpaceEnd = header.cellPointerArrayOffset;

  // Parsing the rowid cells
  const cells: SqliteTableInteriorCell[] = new Array(cellPointerArray.length);
  for (let i = 0; i < cellPointerArray.length; i++) {
    const pageNumber = view.getUint32(cellPointerArray[i].value);
    const [rowid, bytesLength] = parseVarint(
      view,
      cellPointerArray[i].value + 4
    );

    cells[i] = {
      pageNumber,
      rowid,
      content: pageData.subarray(
        cellPointerArray[i].value,
        cellPointerArray[i].value + 4 + bytesLength
      ),
      length: bytesLength + 4,
      offset: cellPointerArray[i].value,
    };
  }

  cells.sort((a, b) => a.offset - b.offset);

  return {
    ...page,
    cellPointerArray,
    cells,
    unallocatedSpace: {
      content: pageData.subarray(unallocatedSpaceStart, unallocatedSpaceEnd),
      offset: unallocatedSpaceStart,
      length: unallocatedSpaceEnd - unallocatedSpaceStart,
    },
  };
}

export function parseTableLeafPage(
  db: SqliteDatabase,
  page: SqlitePage
): SqliteTableLeafPage {
  const { header, pageData } = page;
  const view = new DataView(
    pageData.buffer,
    pageData.byteOffset,
    pageData.byteLength
  );

  // Parsing the cell pointer array
  let ptr = 8 + page.headerOffset;

  const cellPointerArray: SqliteCellPointer[] = new Array(header.cellCount);
  for (let i = 0; i < header.cellCount; i++) {
    cellPointerArray[i] = {
      offset: ptr,
      length: 2,
      content: pageData.subarray(ptr, ptr + 2),
      value: view.getUint16(ptr),
    };

    ptr += 2;
  }

  const unallocatedSpaceStart = ptr;
  const unallocatedSpaceEnd = header.cellPointerArrayOffset;

  // Parsing the rowid cells
  const cells: SqliteTableLeafCell[] = new Array(cellPointerArray.length);
  for (let i = 0; i < cellPointerArray.length; i++) {
    let cursor = cellPointerArray[i].value;

    const [size, sizeBytes] = parseVarint(view, cursor);
    cursor += sizeBytes;

    const [rowid, rowidBytes] = parseVarint(view, cursor);
    cursor += rowidBytes;

    let localSize = size;
    let overflow = false;

    if (size > db.maxLocal) {
      localSize = db.minLocal + ((size - db.minLocal) % (db.usableSize - 4));
      overflow = true;
    }

    console.log(localSize, size, sizeBytes, rowidBytes, cursor);

    const payload = pageData.subarray(cursor, cursor + localSize);
    cursor += localSize;

    let overflowPageNumber = 0;

    // if (overflow) {
    //   console.log("Overflow detected", size, localSize, cursor);
    //   overflowPageNumber = view.getUint32(cursor);
    //   cursor += 4;
    // }

    cells[i] = {
      rowid,
      size,
      content: pageData.subarray(cellPointerArray[i].value, cursor),
      overflowPageNumber,
      payload,
      length: cursor - cellPointerArray[i].value,
      offset: cellPointerArray[i].value,
    };
  }

  cells.sort((a, b) => a.offset - b.offset);

  return {
    ...page,
    cellPointerArray,
    cells,
    unallocatedSpace: {
      content: pageData.subarray(unallocatedSpaceStart, unallocatedSpaceEnd),
      offset: unallocatedSpaceStart,
      length: unallocatedSpaceEnd - unallocatedSpaceStart,
    },
  };
}

export function parsePage(
  view: DataView,
  pageSize: number,
  pageNumber: number
): SqlitePage {
  const offset = pageNumber * pageSize;
  const pageData = new Uint8Array(view.buffer, offset, pageSize);
  const pageHeaderOffset = pageNumber === 0 ? 100 : 0;
  const pageType = pageData[pageHeaderOffset];

  let pageTypeName = "Unknown";

  switch (pageType) {
    case 0x0d:
      pageTypeName = "Table Leaf";
      break;
    case 0x05:
      pageTypeName = "Table Interior";
      break;
    case 0x0a:
      pageTypeName = "Index Leaf";
      break;
    case 0x02:
      pageTypeName = "Index Interior";
      break;
    case 0x0c:
      pageTypeName = "Freelist page";
      break;
    case 0x10:
      pageTypeName = "Overflow page";
      break;
    default:
      pageTypeName = "Unknown";
  }

  const header = parsePageHeader(pageData, pageHeaderOffset);

  return {
    header,
    headerOffset: pageHeaderOffset,
    pageType,
    pageTypeName,
    pageNumber: pageNumber + 1,
    pageData,
  };
}

export function parseSqlite(buffer: ArrayBuffer): SqliteDatabase {
  const view = new DataView(buffer);
  const header = parseHeader(view);

  const pages = Array.from({ length: header.pageCount }, (_, i) => {
    return parsePage(view, header.pageSize, i);
  });

  const usableSize = header.pageSize - header.reservedSpace;
  const maxLocal = Math.floor(((usableSize - 12) * 64) / 255 - 23);
  const minLocal = Math.floor(((usableSize - 12) * 32) / 255 - 23);

  console.log(maxLocal, minLocal, usableSize);

  return { header, pages, maxLocal, minLocal, usableSize };
}
