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
import { useInfoContext } from "./info-context";

interface TableLeafCanvasProps {
  page: TableLeafPage | TableInteriorPage | IndexInteriorPage | IndexLeafPage;
  db: Database;
}

export function TableLeafCanvas({ page, db }: TableLeafCanvasProps) {
  const { info, setInfo } = useInfoContext();
  const headerOffset = page.number === 1 ? 100 : 0;
  const headerSize =
    page.type === "Table Leaf" || page.type === "Index Leaf" ? 8 : 12;

  const startTableScan = () => {
    if (page.type === "Table Leaf") {
      setInfo({
        type: "table-scan",
        page: page as TableLeafPage,
        db,
      });
    }
  };

  // Check if we're currently in a table scan for this page
  const isTableScan = info.type === "table-scan" && 
                     info.page.number === page.number;

  // Get the current cell index and cell pointer index from the info context if we're in a table scan
  const currentScanCellIndex = isTableScan ? info.currentCellIndex : -1;
  const currentScanCellPointerIndex = isTableScan ? info.currentCellPointerIndex : -1;

  return (
    <>
      <PageHeader page={page}>
        {page.type === "Table Leaf" && (
          <button
            onClick={startTableScan}
            className="ml-4 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Full Table Scan
          </button>
        )}
      </PageHeader>
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

            // Check if this cell pointer is the current one being used in the scan
            const isCurrentScanCellPointer = isTableScan && 
                                           page.type === "Table Leaf" && 
                                           index === currentScanCellPointerIndex;

            // Determine the color class based on whether this is the current scan cell pointer
            const colorClass = isCurrentScanCellPointer ? "bg-blue-500" : "bg-yellow-300";

            // Always show the arrow for the current cell pointer during a scan, or for all cell pointers when not scanning
            const showArrow = !isTableScan || isCurrentScanCellPointer;

            return (
              <PageCanvasSegment
                key={index}
                offset={cellOffset}
                length={cellLength}
                info={{ type: "btree-cell-pointer", page, cellPointer: cell }}
                colorClassName={colorClass}
                pointToOffset={showArrow ? cell.value : undefined}
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

            // Check if this cell is the current cell being scanned
            const isCurrentScanCell = isTableScan && 
                                     page.type === "Table Leaf" && 
                                     index === currentScanCellIndex;

            // Determine the color class based on whether this is the current scan cell
            const colorClass = isCurrentScanCell ? "bg-green-500" : "bg-red-300";

            return (
              <PageCanvasSegment
                key={index}
                offset={cellOffset}
                length={cellLength}
                colorClassName={colorClass}
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
