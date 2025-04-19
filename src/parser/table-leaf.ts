import { parseVarint } from "../parser-utils";
import {
  DatabaseBTreePage,
  DatabaseHeader,
  TableLeafPage,
  TableLeafCell,
} from "../type";

export function parseTableLeafPage(
  page: DatabaseBTreePage,
  header: DatabaseHeader
): TableLeafPage {
  const { cellPointerArray, data } = page;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // Max local size
  const usableSize = header.pageSize - header.reservedSpace;
  const maxLocal = usableSize - 35;
  const minLocal = Math.floor(((usableSize - 12) * 32) / 255 - 23);

  // Parsing the rowid cells
  const cells: TableLeafCell[] = new Array(cellPointerArray.length);
  for (let i = 0; i < cellPointerArray.length; i++) {
    let cursor = cellPointerArray[i].value;

    const [size, sizeBytes] = parseVarint(view, cursor);
    cursor += sizeBytes;

    const [rowid, rowidBytes] = parseVarint(view, cursor);
    cursor += rowidBytes;

    let localSize = size;
    let overflow = false;

    if (size > maxLocal) {
      localSize = minLocal + ((size - minLocal) % (usableSize - 4));
      if (localSize >= maxLocal) localSize = minLocal;
      overflow = true;
    }

    const payload = data.subarray(cursor, cursor + localSize);
    cursor += localSize;

    let overflowPageNumber = 0;

    try {
      if (overflow) {
        overflowPageNumber = view.getUint32(cursor);
        cursor += 4;
      }
    } catch {
      console.error("Error reading overflow page number:", { page: page.number, cell: cellPointerArray[i].value, size, localSize, overflow, minLocal, maxLocal, usableSize });
    }

    cells[i] = {
      rowid,
      size,
      payloadSizeLength: sizeBytes,
      rowidLength: rowidBytes,
      content: data.subarray(cellPointerArray[i].value, cursor),
      overflowPageNumber,
      payload,
      length: cursor - cellPointerArray[i].value,
      offset: cellPointerArray[i].value,
    };
  }

  cells.sort((a, b) => a.offset - b.offset);

  return { ...page, type: "Table Leaf", cells };
}
