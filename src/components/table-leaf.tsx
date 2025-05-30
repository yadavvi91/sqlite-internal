import {
  Database,
  IndexInteriorPage,
  IndexLeafPage,
  InfoType,
  TableInteriorCell,
  TableLeafCell,
  TableInteriorPage,
  TableLeafPage,
  IndexInteriorCell,
  IndexLeafCell,
} from "../type";
import { CANVAS_GRID_X_SIZE } from "./consts";
import { PageCanvas, PageCanvasSegment } from "./page-canvas";
import { PageCanvasContainer, PageHeader } from "./page-header";

interface TableLeafCanvasProps {
  page: TableLeafPage | TableInteriorPage | IndexInteriorPage | IndexLeafPage;
  db: Database;
}

export function TableLeafCanvas({ page, db }: TableLeafCanvasProps) {
  const headerOffset = page.number === 1 ? 100 : 0;
  const headerSize =
    page.type === "Table Leaf" || page.type === "Index Leaf" ? 8 : 12;

  return (
    <>
      <PageHeader page={page} />
      <PageCanvasContainer>
        <PageCanvas size={db.header.pageSize} x={CANVAS_GRID_X_SIZE}>
          {page.number === 1 && (
            <PageCanvasSegment
              offset={0}
              length={100}
              colorClassName="bg-blue-300"
              label="Database Header"
              info={{
                type: "database-header",
                database: db,
              }}
            />
          )}

          <PageCanvasSegment
            offset={headerOffset}
            length={headerSize}
            colorClassName="bg-green-300"
            label="Page header"
            info={{
              type: "btree-page-header",
              page: page,
            }}
          />

          {page.cellPointerArray.map((cell, index) => {
            const cellOffset = cell.offset;
            const cellLength = cell.length;

            return (
              <PageCanvasSegment
                key={index}
                offset={cellOffset}
                length={cellLength}
                info={{ type: "btree-cell-pointer", page, cellPointer: cell }}
                colorClassName="bg-yellow-300"
                pointToOffset={cell.value}
              />
            );
          })}

          {page.cells.map((cell, index) => {
            const cellOffset = cell.offset;
            const cellLength = cell.length;

            let info: InfoType | undefined = undefined;

            if (page.type === "Table Leaf") {
              info = {
                type: "table-leaf-cell",
                page,
                cell: cell as TableLeafCell,
              };
            } else if (page.type === "Table Interior") {
              info = {
                type: "table-interior-cell",
                page,
                cell: cell as TableInteriorCell,
              };
            } else if (page.type === "Index Interior") {
              info = {
                type: "index-interior-cell",
                page,
                cell: cell as IndexInteriorCell,
              };
            } else if (page.type === "Index Leaf") {
              info = {
                type: "index-leaf-cell",
                page,
                cell: cell as IndexLeafCell,
              };
            }

            return (
              <PageCanvasSegment
                key={index}
                offset={cellOffset}
                length={cellLength}
                colorClassName="bg-red-300"
                label={
                  page.type === "Table Leaf"
                    ? `Rowid: ${(cell as TableLeafCell).rowid}`
                    : `Cell`
                }
                info={info}
              />
            );
          })}
        </PageCanvas>
      </PageCanvasContainer>
    </>
  );
}
