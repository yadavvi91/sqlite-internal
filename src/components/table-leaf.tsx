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
      <h1 className="mx-4 mt-4 font-bold">Page 1</h1>
      <div className="p-2 m-4 border rounded shadow-md inline-block">
        <PageCanvas size={db.header.pageSize} x={40}>
          {page.number === 1 && (
            <PageCanvasSegment
              offset={0}
              length={100}
              colorClassName="bg-blue-300"
              label="Database Header"
            />
          )}

          <PageCanvasSegment
            offset={headerOffset}
            length={12}
            colorClassName="bg-green-300"
            label="Page header"
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
                label={`Row`}
              />
            );
          })}
        </PageCanvas>
      </div>
    </div>
  );
}
