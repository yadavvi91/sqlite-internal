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
  const [selectedTablePage, setSelectedTablePage] = useState<TableLeafPage | null>(null);
  const [tablePages, setTablePages] = useState<TableLeafPage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Find all table leaf pages in the database
  useEffect(() => {
    setIsLoading(true);

    // Filter pages to find all table leaf pages
    const tableLeafPages = db.pages.filter(
      (page): page is TableLeafPage => page.type === "Table Leaf"
    );

    setTablePages(tableLeafPages);
    setIsLoading(false);

    // Update the InfoContext to show we're in the full database table scan
    setInfo({
      type: "full-database-table-scan",
      db: db,
    });
  }, [db, setInfo]);

  // Handle table selection
  const handleTableSelect = (page: TableLeafPage) => {
    setSelectedTablePage(page);

    // Update the InfoContext to show we've selected a table page in the full database table scan
    setInfo({
      type: "full-database-table-scan",
      db: db,
      selectedTablePage: page,
    });

    // Update the URL hash to navigate to the selected table's page
    window.location.hash = `page=${page.number}`;
  };

  return (
    <InfoContent>
      {!selectedTablePage ? (
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
                {tablePages.length === 0 ? (
                  <p>No table leaf pages found in the database.</p>
                ) : (
                  <div className="space-y-2">
                    {tablePages.map((page) => (
                      <div
                        key={page.number}
                        className="p-2 border border-gray-200 rounded cursor-pointer hover:bg-blue-50"
                        onClick={() => handleTableSelect(page)}
                      >
                        <p className="font-medium">
                          {page.description || `Table Page ${page.number}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          Page: {page.number}, Cells: {page.cells.length}
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
        // Once a table is selected, use the existing TableScanInfo component
        <TableScanInfo page={selectedTablePage} db={db} />
      )}
    </InfoContent>
  );
}
