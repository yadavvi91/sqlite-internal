export interface Database {
  header: DatabaseHeader;
  pages: DatabaseParsedPage[];
}

export interface DatabaseHeader {
  pageSize: number;
  fileFormatWriteVersion: number;
  fileFormatReadVersion: number;
  reservedSpace: number;
  maximumEmbedPayloadFraction: number;
  minimumEmbedPayloadFraction: number;
  leafPayloadFraction: number;
  fileChangeCounter: number;
  pageCount: number;
  firstFreelistPage: number;
  totalFreelistPages: number;
  schemaCookie: number;
  schemaFormatNumber: number;
  defaultPageCacheSize: number;
  largesRootBTreePage: number;

  textEncoding: number;
  userVersion: number;
  incrementalVacuumMode: number;
  applicationId: number;
  reservedForExpansion: number;
  versionValidFor: number;
  sqliteVersionNumber: number;
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

export interface TableInteriorCell {
  pageNumber: number;
  rowid: number;
  rowidLength: number;
  content: ArrayBuffer;
  length: number;
  offset: number;
}

export interface TableInteriorPage extends DatabaseBTreePage {
  type: "Table Interior";
  cells: TableInteriorCell[];
}

export interface TableLeafCell {
  size: number;
  payloadSizeLength: number;
  rowid: number;
  rowidLength: number;
  payload: ArrayBuffer;
  overflowPageNumber: number;
  content: ArrayBuffer;
  length: number;
  offset: number;
}

export interface TableLeafPage extends DatabaseBTreePage {
  type: "Table Leaf";
  cells: TableLeafCell[];
}

export interface IndexInteriorCell {
  leftChildPagePointer: number;
  payloadSize: number;
  payloadSizeBytes: number;
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

export interface OverflowPayload {
  offset: number;
  length: number;
  content: ArrayBuffer;
}
export interface OverflowPage extends DatabaseUnparsedPage {
  type: "Overflow";
  nextPage: number;
  payload: OverflowPayload;
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

export type InfoType =
  | {
      type: "started";
    }
  | {
      type: "database" | "database-header";
      database: Database;
    }
  | {
      type: "page";
      database: Database;
      page: DatabaseParsedPage;
    }
  | {
      type: "btree-page-header";
      page: DatabaseParsedPage;
    }
  | {
      type: "btree-cell-pointer";
      page: DatabaseParsedPage;
      cellPointer: SqliteCellPointer;
    }
  | {
      type: "table-leaf-cell";
      page: TableLeafPage;
      cell: TableLeafCell;
    }
  | {
      type: "table-interior-cell";
      page: TableInteriorPage;
      cell: TableInteriorCell;
    }
  | {
      type: "index-leaf-cell";
      page: IndexLeafPage;
      cell: IndexLeafCell;
    }
  | {
      type: "index-interior-cell";
      page: IndexInteriorPage;
      cell: IndexInteriorCell;
    }
  | {
      type: "free-trunk-page";
      page: FreeTrunkPage;
    }
  | {
      type: "free-leaf-page";
      page: FreeLeafPage;
    }
  | {
      type: "overflow-page";
      page: OverflowPage;
    }
  | {
      type: "unknown-page";
      page: UnknownPage;
    };
