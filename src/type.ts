export interface SqliteDatabase {
  header: SqliteHeader;
  pages: SqlitePage[];

  // This will be used if payload will be overflowed to another page.
  usableSize: number;
  maxLocal: number;
  minLocal: number;
}

export interface SqliteHeader {
  pageSize: number;
  fileFormatWriteVersion: number;
  fileFormatReadVersion: number;
  reservedSpace: number;
  maxPageSize: number;
  writeVersion: number;
  readVersion: number;
  reservedSpace2: number;
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
  rightChildPageNumber: number;
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
