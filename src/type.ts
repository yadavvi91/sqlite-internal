export interface SqliteDatabase {
  header: SqliteHeader;
  pages: SqlitePage[];

  // This will be used if payload will be overflowed to another page.
  usableSize: number;
  maxLocal: number;
  minLocal: number;
}

export interface Database {
  header: DatabaseHeader;
  pages: DatabaseParsedPage[];
}

export interface DatabaseHeader {
  pageSize: number;
  fileFormatWriteVersion: number;
  fileFormatReadVersion: number;
  reservedSpace: number;
  maxPageSize: number;
  writeVersion: number;
  readVersion: number;
  pageCount: number;
  firstFreelistPage: number;
  totalFreelistPages: number;
  schemaCookie: number;
  schemaFormatNumber: number;
  schemaChangeCounter: number;
  fileChangeCounter: number;
}

export type DatabasePageType =
  | "Table Interior"
  | "Table Leaf"
  | "Index Interior"
  | "Index Leaf"
  | "Free Trunk"
  | "Free Leaf"
  | "Overflow"
  | "Unknown";

export interface DatabaseUnparsedPage {
  number: number;
  data: Uint8Array;
  type: DatabasePageType;
}

export interface DatabaseBTreePage extends DatabaseUnparsedPage {
  header: SqlitePageHeader;
  cellPointerArray: SqliteCellPointer[];
}

export interface TableInteriorPage extends DatabaseBTreePage {
  type: "Table Interior";
  cells: SqliteTableInteriorCell[];
}

export interface TableLeafPage extends DatabaseBTreePage {
  type: "Table Leaf";
  cells: SqliteTableLeafCell[];
}

export interface IndexInteriorCell {
  leftChildPagePointer: number;
  payloadSize: number;
  payload: ArrayBuffer;
  overflowPageNumber: number | null;
  length: number;
  offset: number;
}

export interface IndexInteriorPage extends DatabaseBTreePage {
  type: "Index Interior";
  cells: IndexInteriorCell[];
}

export interface IndexLeafCell {
  payloadSize: number;
  payload: ArrayBuffer;
  overflowPageNumber: number | null;
  length: number;
  offset: number;
}

export interface IndexLeafPage extends DatabaseBTreePage {
  type: "Index Leaf";
  cells: IndexLeafCell[];
}

export interface FreeTrunkCell {
  offset: number;
  length: number;
  pageNumber: number;
}

export interface FreeTrunkPage extends DatabaseUnparsedPage {
  type: "Free Trunk";
  nextTrunkPage: number;
  count: number;
  freePageNumbers: FreeTrunkCell[];
}
export interface FreeLeafPage extends DatabaseUnparsedPage {
  type: "Free Leaf";
}

export interface OverflowPage extends DatabaseUnparsedPage {
  type: "Overflow";
  nextPage: number;
}

export interface UnknownPage extends DatabaseUnparsedPage {
  type: "Unknown";
}

export type DatabaseParsedPage =
  | TableInteriorPage
  | TableLeafPage
  | IndexInteriorPage
  | IndexLeafPage
  | FreeTrunkPage
  | FreeLeafPage
  | OverflowPage
  | UnknownPage;

export interface SqliteHeader {
  pageSize: number;
  fileFormatWriteVersion: number;
  fileFormatReadVersion: number;
  reservedSpace: number;
  maxPageSize: number;
  writeVersion: number;
  readVersion: number;
  pageCount: number;
  firstFreelistPage: number;
  totalFreelistPages: number;
  schemaCookie: number;
  schemaFormatNumber: number;
  schemaChangeCounter: number;
  fileChangeCounter: number;
}

export interface SqlitePageHeader {
  pageType: number;
  firstFreeblockOffset: number;
  cellCount: number;
  cellPointerArrayOffset: number;
  fragmentFreeBytes: number;
  rightChildPageNumber: number | null;
}

export interface SqliteCellPointer {
  offset: number;
  length: number;
  content: ArrayBuffer;
  value: number;
}

export interface SqliteUnallocatedSpace {
  content: ArrayBuffer;
  offset: number;
  length: number;
}

export interface SqlitePage {
  header: SqlitePageHeader;
  pageType: number;
  pageTypeName: string;
  pageNumber: number;
  pageData: Uint8Array;

  // This is the offset of the page header in the page data.
  // It is always 100 for the first page and 0 for all other pages.
  headerOffset: number;
}

export interface SqliteTableInteriorCell {
  pageNumber: number;
  rowid: number;
  content: ArrayBuffer;
  length: number;
  offset: number;
}

export interface SqliteTableInteriorPage extends SqlitePage {
  cellPointerArray: SqliteCellPointer[];
  cells: SqliteTableInteriorCell[];
  unallocatedSpace: SqliteUnallocatedSpace;
}

export interface SqliteTableLeafCell {
  size: number;
  rowid: number;
  payload: ArrayBuffer;
  overflowPageNumber: number;
  content: ArrayBuffer;
  length: number;
  offset: number;
}

export interface SqliteTableLeafPage extends SqlitePage {
  cellPointerArray: SqliteCellPointer[];
  cells: SqliteTableLeafCell[];
  unallocatedSpace: SqliteUnallocatedSpace;
}
