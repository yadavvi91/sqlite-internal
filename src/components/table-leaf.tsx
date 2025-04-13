import { Database, TableLeafPage } from "../type";
import { PageCanvas, PageCanvasSegment } from "./page-canvas";

interface TableLeafCanvasProps {
  page: TableLeafPage;
  db: Database;
}

export function TableLeafCanvas({ page, db }: TableLeafCanvasProps) {
  const headerOffset = page.number === 1 ? 100 : 0;

  return (
    <div>
      <div className="mb-2">
        <div className="font-bold">Page 1 | Table Interior</div>
      </div>
      <div className="p-2 bg-white border border-black rounded inline-block">
        <PageCanvas size={db.header.pageSize} x={32}>
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
            length={12}
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
                colorClassName="bg-yellow-300"
                label={`•`}
              />
            );
          })}

          {page.cells.map((cell, index) => {
            const cellOffset = cell.offset;
            const cellLength = cell.length;

            return (
              <PageCanvasSegment
                key={index}
                offset={cellOffset}
                length={cellLength}
                colorClassName="bg-red-300"
                label={`Cell`}
              />
            );
          })}
        </PageCanvas>
      </div>
    </div>
  );
}
