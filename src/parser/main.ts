import {
  Database,
  DatabaseBTreePage,
  DatabaseHeader,
  DatabasePageType,
  DatabaseParsedPage,
  DatabaseUnparsedPage,
  SqliteCellPointer,
} from "../type";
import { parseIndexInteriorPage } from "./index-interior";
import { parseIndexLeafPage } from "./index-leaf";
import { parseTableLeafPage } from "./table-leaf";
import { parseTableInteriorPage } from "./table-interior";
import { walkThroughFreeList } from "./freelist";
import { walkThroughOverflowPage } from "./overflow";

export function parseDatabaseHeader(buffer: ArrayBuffer): DatabaseHeader {
  const view = new DataView(buffer, 0, 100);

  const header = {
    pageSize: view.getUint16(16),
    fileFormatWriteVersion: view.getUint8(18),
    fileFormatReadVersion: view.getUint8(19),
    reservedSpace: view.getUint8(20),
    maximumEmbedPayloadFraction: view.getUint8(21),
    minimumEmbedPayloadFraction: view.getUint8(22),
    leafPayloadFraction: view.getUint8(23),
    fileChangeCounter: view.getUint32(24),
    pageCount: view.getUint32(28),
    firstFreelistPage: view.getUint32(32),
    totalFreelistPages: view.getUint32(36),
    schemaCookie: view.getUint32(40),
    schemaFormatNumber: view.getUint32(44),
    defaultPageCacheSize: view.getUint32(48),
    largesRootBTreePage: view.getUint32(52),
    textEncoding: view.getUint8(56),
    userVersion: view.getUint32(60),
    incrementalVacuumMode: view.getUint32(64),
    applicationId: view.getUint32(68),
    reservedForExpansion: 0,
    versionValidFor: view.getUint32(92),
    sqliteVersionNumber: view.getUint32(96),
  };

  return header;
}

export function splitPages(
  buffer: ArrayBuffer,
  header: DatabaseHeader
): DatabaseUnparsedPage[] {
  const pageSize = header.pageSize;
  const pageCount = header.pageCount;
  const pages: DatabaseUnparsedPage[] = [];

  for (let i = 0; i < pageCount; i++) {
    const offset = i * pageSize;
    pages.push({
      number: i + 1,
      data: new Uint8Array(buffer, offset, pageSize),
      type: "Unknown",
    });
  }

  return pages;
}

export function parseBTreePage(
  page: DatabaseUnparsedPage
): DatabaseBTreePage | null {
  const view = new DataView(
    page.data.buffer,
    page.data.byteOffset,
    page.data.byteLength
  );

  let cursor = page.number === 1 ? 100 : 0;

  const btreeType = view.getUint8(cursor);
  let pageType: DatabasePageType = "Unknown";

  if (btreeType === 0x0d) {
    pageType = "Table Leaf";
  } else if (btreeType === 0x05) {
    pageType = "Table Interior";
  } else if (btreeType === 0x0a) {
    pageType = "Index Leaf";
  } else if (btreeType === 0x02) {
    pageType = "Index Interior";
  } else {
    return null;
  }

  const cellCount = view.getUint16(cursor + 3);
  const cellPointerArrayOffset = view.getUint16(cursor + 5);
  let rightChildPageNumber: number | null = null;

  // Leaf page only have 8 bytes header size
  let headerSize = 8;

  // The four-byte page number at offset 8 is the right-most pointer.
  // This value appears in the header of interior b-tree pages only and
  // is omitted from all other pages.
  if (pageType === "Index Interior" || pageType === "Table Interior") {
    rightChildPageNumber = view.getUint32(cursor + 8);
    headerSize = 12;
  }

  cursor += headerSize;
  const cellPointerArray: SqliteCellPointer[] = [];

  for (let i = 0; i < cellCount; i++) {
    cellPointerArray.push({
      offset: cursor,
      length: 2,
      content: page.data.subarray(cursor, cursor + 2),
      value: view.getUint16(cursor),
    });

    cursor += 2;
  }

  return {
    ...page,
    type: pageType,
    cellPointerArray,
    header: {
      pageType: btreeType,
      firstFreeblockOffset: view.getUint16(cursor + 1),
      cellCount,
      cellPointerArrayOffset,
      fragmentFreeBytes: view.getUint8(cursor + 7),
      rightChildPageNumber,
    },
  };
}

export function parsePage(
  page: DatabaseUnparsedPage,
  header: DatabaseHeader
): DatabaseParsedPage {
  const btree = parseBTreePage(page);

  if (btree) {
    if (btree.type === "Table Interior") {
      return parseTableInteriorPage(btree);
    } else if (btree.type === "Table Leaf") {
      return parseTableLeafPage(btree, header);
    } else if (btree.type === "Index Interior") {
      return parseIndexInteriorPage(btree, header);
    } else if (btree.type === "Index Leaf") {
      return parseIndexLeafPage(btree, header);
    }
  }

  // Always fallback to unknown page
  return {
    ...page,
    type: "Unknown",
  };
}

export function parseDatabase(buffer: ArrayBuffer): Database {
  // Parse the header first
  const header = parseDatabaseHeader(buffer);

  // Split the pages
  const unparsedPages = splitPages(buffer, header);

  // Mark all free pages
  let pages = walkThroughFreeList(unparsedPages, header);

  // Parse all b-tree pages
  pages = pages.map((page) => parsePage(page, header));
  pages = walkThroughOverflowPage(pages);

  return {
    header,
    pages,
  };
}
