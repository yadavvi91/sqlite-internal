import { DatabaseBTreePage } from "../../type";
import { useInfoContext } from "../info-context";
import { BPageHeaderInfo } from "./bpage-header";
import { CellPointerInfo } from "./cell-pointer";
import { DatabaseHeaderInfo } from "./database-header";
import { FullDatabaseTableScan } from "./full-database-table-scan";
import { IndexInteriorCellInfo } from "./index-interior-cell";
import { IndexLeafCellInfo } from "./index-leaf-cell";
import { OverflowNextPageInfo } from "./overflow-next-page";
import { OverflowPayloadInfo } from "./overflow-payload";
import { StartedInfo } from "./starter";
import { TableInteriorCellInfo } from "./table-interior-cell";
import { TableLeafCellInfo } from "./table-leaf-cell";
import { TableScanInfo } from "./table-scan";

export function InfoSidebar() {
  const { info, setInfo } = useInfoContext();

  if (info.type === "database-header") {
    return (
      <DatabaseHeaderInfo
        header={info.database.header}
        page={info.database.pages[0]}
      />
    );
  } else if (info.type === "btree-page-header") {
    return <BPageHeaderInfo page={info.page as DatabaseBTreePage} />;
  } else if (info.type === "table-leaf-cell") {
    return <TableLeafCellInfo cell={info.cell} page={info.page} />;
  } else if (info.type === "table-interior-cell") {
    return <TableInteriorCellInfo cell={info.cell} page={info.page} />;
  } else if (info.type === "btree-cell-pointer") {
    return <CellPointerInfo pointer={info.cellPointer} page={info.page} />;
  } else if (info.type === "index-interior-cell") {
    return <IndexInteriorCellInfo cell={info.cell} page={info.page} />;
  } else if (info.type === "index-leaf-cell") {
    return <IndexLeafCellInfo cell={info.cell} page={info.page} />;
  } else if (info.type === "overflow-next-page") {
    return <OverflowNextPageInfo page={info.page} />;
  } else if (info.type === "overflow-payload") {
    return <OverflowPayloadInfo page={info.page} />;
  } else if (info.type === "table-scan") {
    return <TableScanInfo 
      page={info.page} 
      db={info.db} 
      tableName={info.tableName}
      currentPageIndex={info.currentPageIndex}
      totalPages={info.totalPages}
      onPrevPage={info.isPartOfFullDatabaseScan ? () => {
        // Handle navigation through hash change
        const pagesForTable = info.tableName ? 
          info.db.pages.filter(p => p.type === "Table Leaf" && p.description === info.tableName) : [];

        if (info.currentPageIndex !== undefined && info.currentPageIndex > 0) {
          const prevIndex = info.currentPageIndex - 1;
          const prevPage = pagesForTable[prevIndex];
          if (prevPage) {
            // Update the info context with the new page
            setInfo({
              type: "table-scan",
              page: prevPage,
              db: info.db,
              tableName: info.tableName,
              currentPageIndex: prevIndex,
              totalPages: info.totalPages,
              isPartOfFullDatabaseScan: true
            });
            // Update the URL hash to navigate to the previous page
            window.location.hash = `page=${prevPage.number}`;
          }
        }
      } : undefined}
      onNextPage={info.isPartOfFullDatabaseScan ? () => {
        // Handle navigation through hash change
        const pagesForTable = info.tableName ? 
          info.db.pages.filter(p => p.type === "Table Leaf" && p.description === info.tableName) : [];

        if (info.currentPageIndex !== undefined && info.totalPages !== undefined && 
            info.currentPageIndex < info.totalPages - 1) {
          const nextIndex = info.currentPageIndex + 1;
          const nextPage = pagesForTable[nextIndex];
          if (nextPage) {
            // Update the info context with the new page
            setInfo({
              type: "table-scan",
              page: nextPage,
              db: info.db,
              tableName: info.tableName,
              currentPageIndex: nextIndex,
              totalPages: info.totalPages,
              isPartOfFullDatabaseScan: true
            });
            // Update the URL hash to navigate to the next page
            window.location.hash = `page=${nextPage.number}`;
          }
        }
      } : undefined}
      onBackToTables={info.isPartOfFullDatabaseScan ? () => {
        // Go back to full database table scan view
        setInfo({
          type: "full-database-table-scan",
          db: info.db
        });

        // Update the URL hash to point to the first page (DB Header page)
        window.location.hash = `page=1`;
      } : undefined}
      onScanComplete={info.isPartOfFullDatabaseScan ? () => {
        // Handle navigation to the next page when scan is complete
        const pagesForTable = info.tableName ? 
          info.db.pages.filter(p => p.type === "Table Leaf" && p.description === info.tableName) : [];

        if (info.currentPageIndex !== undefined && info.totalPages !== undefined && 
            info.currentPageIndex < info.totalPages - 1) {
          const nextIndex = info.currentPageIndex + 1;
          const nextPage = pagesForTable[nextIndex];
          if (nextPage) {
            // Update the info context with the new page
            setInfo({
              type: "table-scan",
              page: nextPage,
              db: info.db,
              tableName: info.tableName,
              currentPageIndex: nextIndex,
              totalPages: info.totalPages,
              isPartOfFullDatabaseScan: true
            });
            // Update the URL hash to navigate to the next page
            window.location.hash = `page=${nextPage.number}`;
          }
        }
      } : undefined}
    />;
  } else if (info.type === "full-database-table-scan") {
    return <FullDatabaseTableScan db={info.db} />;
  }

  return <StartedInfo />;
}
