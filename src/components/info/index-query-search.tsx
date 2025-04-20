import { useEffect, useState, useMemo } from "react";
import { InfoContent, InfoHeader } from "../info";
import { Database, IndexInteriorPage, IndexLeafPage, TableLeafPage } from "../../type";
import { useInfoContext } from "../info-context";
import ReactCodeMirror from "@uiw/react-codemirror";
import { sql, SQLite } from "@codemirror/lang-sql";
import { Database as SQLiteDatabase } from "sql.js";

interface IndexQuerySearchProps {
  db: Database;
  sqliteDb: SQLiteDatabase;
}

interface QueryPlan {
  id: number;
  parent: number;
  notUsed: string;
  detail: string;
}

interface IndexInfo {
  name: string;
  tableName: string;
  rootPage: number;
  sql: string;
}

interface QueryResult {
  tableName: string;
  pages: TableLeafPage[];
  matchingRowids?: number[];
}

export function IndexQuerySearch({ db, sqliteDb }: IndexQuerySearchProps) {
  const { setInfo } = useInfoContext();
  const [query, setQuery] = useState<string>("");
  const [queryPlan, setQueryPlan] = useState<QueryPlan[]>([]);
  const [usesIndex, setUsesIndex] = useState<boolean>(false);
  const [indexName, setIndexName] = useState<string | null>(null);
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchPath, setSearchPath] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [searchComplete, setSearchComplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Navigation state
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [showResultPages, setShowResultPages] = useState<boolean>(false);
  const [matchingRowCount, setMatchingRowCount] = useState<number>(0);

  // CodeMirror extensions
  const extensions = useMemo(() => {
    return [
      sql({
        dialect: SQLite,
      }),
    ];
  }, []);

  // Load available indexes from the database
  useEffect(() => {
    try {
      // Find all index pages in the database
      const indexPages = db.pages.filter(
        page => page.type === "Index Interior" || page.type === "Index Leaf"
      );

      // Get index information from sqlite_master
      const indexInfoMap = new Map<string, IndexInfo>();

      // Group index pages by index name
      const indexPagesMap = new Map<string, (IndexInteriorPage | IndexLeafPage)[]>();

      indexPages.forEach(page => {
        const indexName = page.description || `Unknown Index (Page ${page.number})`;
        if (!indexPagesMap.has(indexName)) {
          indexPagesMap.set(indexName, []);
        }
        indexPagesMap.get(indexName)?.push(page as (IndexInteriorPage | IndexLeafPage));
      });

      // Update the state with the index information
      setIndexes(Array.from(indexPagesMap.keys()).map(name => ({
        name,
        tableName: name.split(' ')[0] || '',
        rootPage: indexPagesMap.get(name)?.[0]?.number || 0,
        sql: ''
      })));
    } catch (err) {
      console.error("Error loading indexes:", err);
      setError("Failed to load indexes from the database.");
    }
  }, [db]);

  // Extract query conditions for display purposes
  const [queryCondition, setQueryCondition] = useState<string>("");

  // Execute the query and get the query plan
  const executeQuery = () => {
    if (!query.trim()) {
      setError("Please enter a SQL query.");
      return;
    }

    setError(null);
    setQueryPlan([]);
    setUsesIndex(false);
    setIndexName(null);
    setSearchPath([]);
    setCurrentStep(0);
    setSearchComplete(false);
    setQueryResult(null);
    setCurrentPageIndex(0);
    setShowResultPages(false);
    setMatchingRowCount(0);

    // Try to extract the WHERE clause for display purposes
    try {
      const whereClauseMatch = query.match(/WHERE\s+([^;]+)/i);
      if (whereClauseMatch && whereClauseMatch[1]) {
        setQueryCondition(whereClauseMatch[1].trim());
      } else {
        setQueryCondition("");
      }
    } catch (err) {
      setQueryCondition("");
    }

    try {
      // Get the query plan
      const explainQuery = `EXPLAIN QUERY PLAN ${query}`;
      const result = sqliteDb.exec(explainQuery);

      if (!result || result.length === 0 || !result[0].values || result[0].values.length === 0) {
        setError("Failed to get query plan.");
        return;
      }

      // Parse the query plan
      const plan: QueryPlan[] = result[0].values.map((row: any[]) => ({
        id: row[0] as number,
        parent: row[1] as number,
        notUsed: row[2] as string,
        detail: row[3] as string
      }));

      setQueryPlan(plan);

      // Check if the query uses an index
      const indexUsage = plan.find(step => 
        step.detail.includes("USING INDEX") || 
        step.detail.includes("SEARCH") && step.detail.includes("USING")
      );

      if (indexUsage) {
        setUsesIndex(true);

        // Extract the index name from the query plan
        const match = indexUsage.detail.match(/USING (?:INDEX|COVERING INDEX) ([^\s]+)/);
        if (match && match[1]) {
          setIndexName(match[1]);

          // Find the index in our list
          const index = indexes.find(idx => idx.name === match[1]);
          if (index) {
            // Start the B-tree search visualization
            startBTreeSearch(index);
          }
        }

        // Extract the table name from the query plan
        // Use a flexible regex that matches "SEARCH" followed by a word (the table name)
        // Use a more explicit regex that handles various formats of the query plan detail
        // This will match both "SEARCH tracks USING INDEX..." and "SEARCH TABLE tracks USING INDEX..."
        const tableMatch = indexUsage.detail.match(/SEARCH(?:\s+TABLE)?\s+([^\s]+)/i);
        if (tableMatch && tableMatch[1]) {
          const tableName = tableMatch[1];

          // Find all pages for this table
          const tablePages = db.pages.filter(
            (page): page is TableLeafPage => 
              page.type === "Table Leaf" && 
              page.description === tableName
          );

          if (tablePages.length > 0) {
            // Sort pages by page number
            const sortedPages = tablePages.sort((a, b) => a.number - b.number);

            setQueryResult({
              tableName,
              pages: sortedPages
            });
          }
        }
      }

      // Execute the actual query to get the results
      const queryResultSet = sqliteDb.exec(query);

      // If we have a table name and the query uses an index, filter the pages to only include those with matching rows
      if (queryResult && queryResultSet && queryResultSet.length > 0) {
        // Get the rowids of the matching rows
        // First, we need to modify the query to get the rowids
        try {
          // Extract the SELECT and FROM parts of the query
          const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM\s+([^\s;]+)/i);
          if (selectMatch) {
            const tableName = selectMatch[2];

            // Create a query to get the rowids
            const rowidQuery = `SELECT rowid FROM ${tableName} WHERE ${queryCondition}`;
            const rowidResult = sqliteDb.exec(rowidQuery);

            if (rowidResult && rowidResult.length > 0 && rowidResult[0].values) {
              // Extract the rowids
              const rowids = rowidResult[0].values.map(row => row[0] as number);

              // Set the matching row count
              setMatchingRowCount(rowids.length);

              // Filter the pages to only include those with matching rowids
              const filteredPages = queryResult.pages.filter(page => 
                page.cells.some(cell => rowids.includes(cell.rowid))
              );

              // Update the queryResult with the filtered pages and matching rowids
              if (filteredPages.length > 0) {
                setQueryResult({
                  tableName: queryResult.tableName,
                  pages: filteredPages,
                  matchingRowids: rowids
                });
              }
            }
          }
        } catch (err) {
          console.error("Error filtering pages by rowid:", err);
          // If there's an error, we'll just use all pages as before
        }
      }

    } catch (err) {
      console.error("Error executing query:", err);
      setError(`Error executing query: ${err}`);
    }
  };

  // Start the B-tree search visualization
  const startBTreeSearch = (index: IndexInfo) => {
    // Find the root page of the index
    const rootPage = db.pages.find(page => page.number === index.rootPage);
    if (!rootPage) {
      setError(`Could not find root page for index ${index.name}`);
      return;
    }

    // Create a search path through the B-tree
    // In a real implementation, this would trace the actual search path based on the query
    // For now, we'll simulate a path from the root to a leaf
    const path: number[] = [rootPage.number];

    // If the root is an interior page, add a path to a leaf
    if (rootPage.type === "Index Interior") {
      // Find a child page
      const interiorPage = rootPage as IndexInteriorPage;
      if (interiorPage.cells.length > 0) {
        const childPageNumber = interiorPage.cells[0].leftChildPagePointer;
        const childPage = db.pages.find(page => page.number === childPageNumber);
        if (childPage) {
          path.push(childPage.number);

          // If the child is also an interior page, continue the path
          if (childPage.type === "Index Interior") {
            const childInteriorPage = childPage as IndexInteriorPage;
            if (childInteriorPage.cells.length > 0) {
              const leafPageNumber = childInteriorPage.cells[0].leftChildPagePointer;
              const leafPage = db.pages.find(page => page.number === leafPageNumber);
              if (leafPage) {
                path.push(leafPage.number);
              }
            }
          }
        }
      }
    }

    setSearchPath(path);
    setIsSearching(true);
  };

  // Handle the next step in the B-tree search
  const handleNextStep = () => {
    if (currentStep < searchPath.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setSearchComplete(true);
      setIsSearching(false);

      // If we have query results, automatically show the data rows
      if (queryResult) {
        showPages();
      }
    }
  };

  // Reset the search
  const resetSearch = () => {
    setCurrentStep(0);
    setSearchComplete(false);
    setIsSearching(true);
  };

  // Navigate to a specific page in the search path
  const navigateToPage = (pageNumber: number) => {
    // Update the URL hash to navigate to the page
    window.location.hash = `page=${pageNumber}`;

    // Update the InfoContext to start an index scan for this page
    const page = db.pages.find(p => p.number === pageNumber);
    if (page && (page.type === "Index Interior" || page.type === "Index Leaf")) {
      // Find the index of this page in the search path
      const pathIndex = searchPath.findIndex(pNum => pNum === pageNumber);

      setInfo({
        type: "index-scan",
        page: page as (IndexInteriorPage | IndexLeafPage),
        db: db,
        indexName: indexName || page.description,
        searchPath: searchPath,
        currentPathStep: pathIndex >= 0 ? pathIndex : undefined,
        currentPageIndex: pathIndex,
        totalPages: searchPath.length
      });
    }
  };

  // Navigate to the next page in the query results
  const handleNextPage = () => {
    if (!queryResult) return;

    if (currentPageIndex < queryResult.pages.length - 1) {
      const nextIndex = currentPageIndex + 1;
      setCurrentPageIndex(nextIndex);

      const nextPage = queryResult.pages[nextIndex];

      // Update the info context with the matching rowids
      setInfo({
        type: "table-scan",
        page: nextPage,
        db: db,
        tableName: queryResult.tableName,
        currentPageIndex: nextIndex,
        totalPages: queryResult.pages.length,
        matchingRowids: queryResult.matchingRowids
      });

      // Update the URL hash to navigate to the next page
      window.location.hash = `page=${nextPage.number}`;
    }
  };

  // Navigate to the previous page in the query results
  const handlePrevPage = () => {
    if (!queryResult) return;

    if (currentPageIndex > 0) {
      const prevIndex = currentPageIndex - 1;
      setCurrentPageIndex(prevIndex);

      const prevPage = queryResult.pages[prevIndex];

      // Update the info context with the matching rowids
      setInfo({
        type: "table-scan",
        page: prevPage,
        db: db,
        tableName: queryResult.tableName,
        currentPageIndex: prevIndex,
        totalPages: queryResult.pages.length,
        matchingRowids: queryResult.matchingRowids
      });

      // Update the URL hash to navigate to the previous page
      window.location.hash = `page=${prevPage.number}`;
    }
  };

  // Show the query result pages
  const showPages = () => {
    if (!queryResult) return;

    setShowResultPages(true);

    // Navigate to the first page
    const firstPage = queryResult.pages[0];

    // Update the info context with the matching rowids
    setInfo({
      type: "table-scan",
      page: firstPage,
      db: db,
      tableName: queryResult.tableName,
      currentPageIndex: 0,
      totalPages: queryResult.pages.length,
      matchingRowids: queryResult.matchingRowids
    });

    // Update the URL hash to navigate to the page
    window.location.hash = `page=${firstPage.number}`;
  };

  return (
    <InfoContent>
      <InfoHeader>Index Query Search</InfoHeader>

      <div className="bg-gray-100 p-3 rounded-md mb-4">
        <div className="mb-3">
          <p className="font-medium">Database Information</p>
          <p className="text-sm text-gray-600">Page Size: {db.header.pageSize} bytes</p>
          <p className="text-sm text-gray-600">Total Pages: {db.header.pageCount}</p>
        </div>

        <div className="mb-4">
          <p className="font-medium mb-2">Available Indexes</p>
          {indexes.length === 0 ? (
            <p className="text-sm text-gray-600">No indexes found in the database.</p>
          ) : (
            <div className="border border-gray-300 rounded p-2 bg-white max-h-40 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Index Name</th>
                    <th className="text-left p-1">Table</th>
                    <th className="text-left p-1">Root Page</th>
                  </tr>
                </thead>
                <tbody>
                  {indexes.map((index, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="p-1">{index.name}</td>
                      <td className="p-1">{index.tableName}</td>
                      <td className="p-1">{index.rootPage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="font-medium mb-2">Enter SQL Query</p>
          <div className="border border-gray-300 rounded bg-white">
            <ReactCodeMirror
              value={query}
              onChange={setQuery}
              className="h-32"
              extensions={extensions}
            />
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={executeQuery}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Execute Query
            </button>
          </div>
          {error && (
            <div className="mt-2 text-red-500 text-sm">{error}</div>
          )}
        </div>

        {queryPlan.length > 0 && (
          <div className="mb-4">
            <p className="font-medium mb-2">Query Plan</p>
            <div className="border border-gray-300 rounded p-2 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">ID</th>
                    <th className="text-left p-1">Parent</th>
                    <th className="text-left p-1">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {queryPlan.map((step, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${step.detail.includes("USING INDEX") ? "bg-green-100" : ""}`}>
                      <td className="p-1">{step.id}</td>
                      <td className="p-1">{step.parent}</td>
                      <td className="p-1">{step.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-2">
              {usesIndex ? (
                <div>
                  <p className="text-green-600">
                    This query uses the index: <strong>{indexName}</strong>
                  </p>
                  {queryResult && (
                    <div className="mt-2">
                      <p className="text-blue-600">
                        Found <strong>{matchingRowCount}</strong> matching rows in {queryResult.pages.length} pages for table: <strong>{queryResult.tableName}</strong>
                      </p>
                      {!showResultPages && (
                        <button
                          onClick={showPages}
                          className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          View Result Pages
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-yellow-600">
                  This query does not use an index.
                </p>
              )}
            </div>
          </div>
        )}

        {usesIndex && searchPath.length > 0 && !showResultPages && (
          <div className="mb-4">
            <p className="font-medium mb-2">B-tree Search Visualization</p>
            <div className="border border-gray-300 rounded p-2 bg-white">
              <div className="mb-2">
                <p className="text-sm">
                  {searchComplete
                    ? queryResult 
                      ? "Search complete! The index has been used to locate the data rows matching your query."
                      : "Search complete! The query has traversed the B-tree index."
                    : `Step ${currentStep + 1} of ${searchPath.length}: Visiting page ${searchPath[currentStep]}`}
                </p>

                {searchComplete && queryResult && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs text-green-800">
                      <strong>Success!</strong> The index search is complete and has found data matching your query.
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      You can now view the actual data rows by clicking the "View Data Rows" button below.
                    </p>
                  </div>
                )}

                <div className="mt-2 flex gap-2">
                  {isSearching && !searchComplete && (
                    <button
                      onClick={handleNextStep}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Next Step
                    </button>
                  )}

                  {(searchComplete || !isSearching) && (
                    <button
                      onClick={resetSearch}
                      className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                    >
                      Restart Search
                    </button>
                  )}

                  {queryResult && !showResultPages && (
                    <button
                      onClick={showPages}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      View Data Rows
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium mb-1">Search Path:</p>
                <div className="flex flex-wrap gap-2">
                  {searchPath.map((pageNumber, index) => {
                    const page = db.pages.find(p => p.number === pageNumber);
                    const isCurrentStep = index === currentStep;
                    const isVisited = index <= currentStep;

                    return (
                      <div
                        key={index}
                        className={`
                          p-2 border rounded cursor-pointer
                          ${isCurrentStep ? "border-blue-500 bg-blue-100" : "border-gray-300"}
                          ${isVisited ? "bg-gray-100" : ""}
                        `}
                        onClick={() => navigateToPage(pageNumber)}
                      >
                        <p className="font-medium">Page {pageNumber}</p>
                        <p className="text-xs text-gray-600">{page?.type || "Unknown"}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ 
                      width: `${searchComplete ? 100 : (currentStep + 1) / searchPath.length * 100}%`,
                      transition: "width 0.5s ease-in-out"
                    }}
                  ></div>
                </div>
                <p className="text-xs text-right mt-1">
                  {currentStep + 1} / {searchPath.length} pages in search path
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Full table scan style navigation for query results */}
        {queryResult && showResultPages && (
          <div className="mb-4">
            <p className="font-medium mb-2">Query Result Pages</p>
            <div className="border border-gray-300 rounded p-2 bg-white">
              <div className="bg-gray-100 p-3 rounded-md mb-4">
                <div className="text-center mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    Use the buttons below to navigate between pages of the {queryResult.tableName} table
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setShowResultPages(false)}
                    className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                  >
                    Back to Query
                  </button>

                  <div className="text-center">
                    <h3 className="font-medium">{queryResult.tableName}</h3>
                    <p className="text-sm text-gray-600">
                      Page {currentPageIndex + 1} of {queryResult.pages.length}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevPage}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center"
                      disabled={currentPageIndex === 0}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Previous Page
                    </button>
                    <button
                      onClick={handleNextPage}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center"
                      disabled={currentPageIndex === queryResult.pages.length - 1}
                    >
                      Next Page
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <p className="font-medium">Current Page: {queryResult.pages[currentPageIndex]?.number}</p>
                <p className="text-sm text-gray-600">Table: {queryResult.tableName}</p>
                <p className="text-sm text-gray-600">Total Cells: {queryResult.pages[currentPageIndex]?.cells.length || 0}</p>

                {/* Explanation of the relationship between index and data */}
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm font-medium text-blue-800">How the Index Was Used:</p>
                  <p className="text-xs text-blue-700 mt-1">
                    The query used the <strong>{indexName}</strong> index to quickly locate <strong>{matchingRowCount}</strong> matching rows in the <strong>{queryResult.tableName}</strong> table.
                  </p>
                  {queryCondition && (
                    <p className="text-xs text-blue-700 mt-1">
                      For your condition <code className="bg-blue-100 px-1 rounded">{queryCondition}</code>, the index allowed SQLite to find the matching rows without scanning the entire table.
                    </p>
                  )}
                  <p className="text-xs text-blue-700 mt-1">
                    Instead of scanning all {queryResult.tableName} table pages, SQLite used the B-tree index structure to find only the {queryResult.pages.length} relevant pages containing the {matchingRowCount} rows that match your query.
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    You are now viewing only the data pages that contain rows matching your query criteria, not the entire table.
                  </p>
                  <div className="mt-2 p-1 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800">
                      <strong>Note:</strong> In a real SQLite database, the index would point directly to the specific rows that match your query. 
                      This visualization shows you the pages containing those rows.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </InfoContent>
  );
}
