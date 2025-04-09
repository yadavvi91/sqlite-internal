import { useMemo } from "react";
import { HexTable, HexTableGroup, HexTableRow } from "./hex-table";
import { parseTableInteriorPage, parseTableLeafPage } from "./parser";
import { SqliteDatabase, SqlitePage } from "./type";
import { PageCommonTable } from "./page-detail-common";

export function PageTableInterior({
  page: rawPage,
}: {
  page: SqlitePage;
  db: SqliteDatabase;
}) {
  const page = useMemo(() => {
    return parseTableInteriorPage(rawPage);
  }, [rawPage]);

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Page {page.pageNumber}</h1>

      <HexTable>
        <PageCommonTable page={page} />

        <HexTableGroup>Interior Cell</HexTableGroup>
        {page.cells.map((cell, index) => {
          return (
            <HexTableRow
              pageNumber={page.pageNumber}
              key={index}
              offset={cell.offset}
              length={cell.length}
              hex={cell.content}
            >
              Pointing to{" "}
              <a
                href={`#page${cell.pageNumber}`}
                className="text-blue-600 underline"
              >
                page <strong>{cell.pageNumber}</strong>
              </a>{" "}
              if rowid {"<"} <strong>{cell.rowid}</strong>
            </HexTableRow>
          );
        })}
      </HexTable>
    </div>
  );
}

export function PageTableLeaf({
  page: rawPage,
  db,
}: {
  page: SqlitePage;
  db: SqliteDatabase;
}) {
  const page = useMemo(() => {
    return parseTableLeafPage(db, rawPage);
  }, [db, rawPage]);

  console.log(page);

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Page {page.pageNumber}</h1>

      <HexTable>
        <PageCommonTable page={page} />

        <HexTableGroup>Cells</HexTableGroup>
        {page.cells.map((cell, index) => {
          return (
            <HexTableRow
              pageNumber={page.pageNumber}
              key={index}
              offset={cell.offset}
              length={cell.length}
              hex={cell.content}
            >
              <strong>Rowid: </strong>
              {cell.rowid} | <strong>Payload Size: </strong> {cell.size}
            </HexTableRow>
          );
        })}
      </HexTable>
    </div>
  );
}
