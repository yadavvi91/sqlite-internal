import { useEffect, useState } from "react";
import { InfoContent, InfoHeader } from "../info";
import { Database, TableLeafPage } from "../../type";
import { useInfoContext } from "../info-context";
import { TableScanInfo } from "./table-scan";

interface FullDatabaseTableScanProps {
  db: Database;
}

export function FullDatabaseTableScan({ db }: FullDatabaseTableScanProps) {
  const { setInfo } = useInfoContext();
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [tablePages, setTablePages] = useState<TableLeafPage[]>([]);
  const [tablePagesMap, setTablePagesMap] = useState<Map<string, TableLeafPage[]>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Find all table leaf pages in the database and group them by table name
  useEffect(() => {
    setIsLoading(true);

    // Filter pages to find all table leaf pages
    const tableLeafPages = db.pages.filter(
      (page): page is TableLeafPage => page.type === "Table Leaf"
    );

    // Group pages by table name (description)
    const pagesMap = new Map<string, TableLeafPage[]>();

    tableLeafPages.forEach(page => {
      const tableName = page.description || `Unknown Table (Page ${page.number})`;
      if (!pagesMap.has(tableName)) {
        pagesMap.set(tableName, []);
      }
      pagesMap.get(tableName)?.push(page);
    });

    // Sort pages within each table by page number
    pagesMap.forEach((pages, tableName) => {
      pagesMap.set(tableName, pages.sort((a, b) => a.number - b.number));
    });

    setTablePagesMap(pagesMap);
    setTablePages(tableLeafPages);
    setIsLoading(false);

    // Update the InfoContext to show we're in the full database table scan
    setInfo({
      type: "full-database-table-scan",
      db: db,
    });
  }, [db, setInfo]);

  // Handle table selection
  const handleTableSelect = (tableName: string) => {
    setSelectedTableName(tableName);
    setCurrentPageIndex(0);

    const pagesForTable = tablePagesMap.get(tableName) || [];
    if (pagesForTable.length > 0) {
      const firstPage = pagesForTable[0];

      // Update the InfoContext to show we've selected a table in the full database table scan
      setInfo({
        type: "full-database-table-scan",
        db: db,
        selectedTablePage: firstPage,
      });

      // Update the URL hash to navigate to the selected table's first page
      window.location.hash = `page=${firstPage.number}`;
    }
  };

  // Navigate to the next page of the selected table
  const handleNextPage = () => {
    if (!selectedTableName) return;

    const pagesForTable = tablePagesMap.get(selectedTableName) || [];
    if (currentPageIndex < pagesForTable.length - 1) {
      const nextIndex = currentPageIndex + 1;
      setCurrentPageIndex(nextIndex);

      const nextPage = pagesForTable[nextIndex];

      // Update the InfoContext with the next page
      setInfo({
        type: "full-database-table-scan",
        db: db,
        selectedTablePage: nextPage,
      });

      // Update the URL hash to navigate to the next page
      window.location.hash = `page=${nextPage.number}`;
    }
  };

  // Navigate to the previous page of the selected table
  const handlePrevPage = () => {
    if (!selectedTableName) return;

    const pagesForTable = tablePagesMap.get(selectedTableName) || [];
    if (currentPageIndex > 0) {
      const prevIndex = currentPageIndex - 1;
      setCurrentPageIndex(prevIndex);

      const prevPage = pagesForTable[prevIndex];

      // Update the InfoContext with the previous page
      setInfo({
        type: "full-database-table-scan",
        db: db,
        selectedTablePage: prevPage,
      });

      // Update the URL hash to navigate to the previous page
      window.location.hash = `page=${prevPage.number}`;
    }
  };

  // Get the current page of the selected table
  const getCurrentPage = (): TableLeafPage | null => {
    if (!selectedTableName) return null;

    const pagesForTable = tablePagesMap.get(selectedTableName) || [];
    if (pagesForTable.length > 0 && currentPageIndex >= 0 && currentPageIndex < pagesForTable.length) {
      return pagesForTable[currentPageIndex];
    }

    return null;
  };

  const currentPage = getCurrentPage();
  const pagesForSelectedTable = selectedTableName ? (tablePagesMap.get(selectedTableName) || []) : [];

  return (
    <InfoContent>
      {!selectedTableName ? (
        <>
          <InfoHeader>Full Database Table Scan</InfoHeader>
          <div className="bg-gray-100 p-3 rounded-md">
            <div className="mb-3">
              <p className="font-medium">Database Header</p>
              <p className="text-sm text-gray-600">Page Size: {db.header.pageSize} bytes</p>
              <p className="text-sm text-gray-600">Total Pages: {db.header.pageCount}</p>
            </div>

            {isLoading ? (
              <p>Loading table pages...</p>
            ) : (
              <div className="border border-gray-300 rounded p-2 bg-white">
                <h3 className="font-medium mb-2">Select a Table to Scan</h3>
                {tablePagesMap.size === 0 ? (
                  <p>No tables found in the database.</p>
                ) : (
                  <div className="space-y-2">
                    {Array.from(tablePagesMap.entries()).map(([tableName, pages]) => (
                      <div
                        key={tableName}
                        className="p-2 border border-gray-200 rounded cursor-pointer hover:bg-blue-50"
                        onClick={() => handleTableSelect(tableName)}
                      >
                        <p className="font-medium">{tableName}</p>
                        <p className="text-sm text-gray-600">
                          Pages: {pages.length}, Total Cells: {pages.reduce((sum, page) => sum + page.cells.length, 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Navigation controls for table pages */}
          <div className="bg-gray-100 p-3 rounded-md mb-4">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setSelectedTableName(null)}
                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                Back to Tables
              </button>

              <div className="text-center">
                <h3 className="font-medium">{selectedTableName}</h3>
                <p className="text-sm text-gray-600">
                  Page {currentPageIndex + 1} of {pagesForSelectedTable.length}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  disabled={currentPageIndex === 0}
                >
                  Previous Page
                </button>
                <button
                  onClick={handleNextPage}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  disabled={currentPageIndex === pagesForSelectedTable.length - 1}
                >
                  Next Page
                </button>
              </div>
            </div>
          </div>

          {/* Use the existing TableScanInfo component for the current page */}
          {currentPage && <TableScanInfo page={currentPage} db={db} onScanComplete={handleNextPage} />}
        </>
      )}
    </InfoContent>
  );
}
