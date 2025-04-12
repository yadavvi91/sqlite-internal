import { parseVarint } from "../parser-utils";
import {
  DatabaseBTreePage,
  TableInteriorPage,
  SqliteTableInteriorCell,
} from "../type";

export function parseTableInteriorPage(
  page: DatabaseBTreePage
): TableInteriorPage {
  const { cellPointerArray, data } = page;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

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
      content: data.subarray(
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
    type: "Table Interior",
    cells,
  };
}
