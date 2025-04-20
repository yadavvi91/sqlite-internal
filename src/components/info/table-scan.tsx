import { useEffect, useState } from "react";
import { InfoContent, InfoHeader } from "../info";
import { Database, SqliteCellPointer, TableLeafCell, TableLeafPage } from "../../type";
import { useInfoContext } from "../info-context";
import { HexViewer } from "../hex-viewer";

interface TableScanInfoProps {
  page: TableLeafPage;
  db: Database;
  onScanComplete?: () => void;
  // Navigation props
  tableName?: string;
  currentPageIndex?: number;
  totalPages?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onBackToTables?: () => void;
  // For index query search
  matchingRowids?: number[];
}

export function TableScanInfo({ 
  page, 
  db, 
  onScanComplete,
  tableName,
  currentPageIndex,
  totalPages,
  onPrevPage,
  onNextPage,
  onBackToTables,
  matchingRowids
}: TableScanInfoProps) {
  const { setInfo } = useInfoContext();
  const [currentCellPointerIndex, setCurrentCellPointerIndex] = useState<number>(-1);
  const [currentCellIndex, setCurrentCellIndex] = useState<number>(-1);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [scanComplete, setScanComplete] = useState<boolean>(false);
  // For binary search-like scan of matching rowids
  const [matchingCellPointerIndices, setMatchingCellPointerIndices] = useState<number[]>([]);
  const [currentMatchingIndex, setCurrentMatchingIndex] = useState<number>(-1);
  const [isBinarySearchScan, setIsBinarySearchScan] = useState<boolean>(false);
  // No longer need scanPhase since we're highlighting both at the same time

  // Update the InfoContext when the current cell pointer index or cell index changes
  useEffect(() => {
    setInfo({
      type: "table-scan",
      page,
      db,
      currentCellIndex,
      currentCellPointerIndex,
      // Preserve navigation props
      tableName,
      currentPageIndex,
      totalPages,
      isPartOfFullDatabaseScan: Boolean(tableName && currentPageIndex !== undefined && totalPages !== undefined),
      // For index query search
      matchingRowids
    });
  }, [currentCellPointerIndex, currentCellIndex, page, db, setInfo, tableName, currentPageIndex, totalPages, matchingRowids]);

  // Find the cell index that corresponds to a cell pointer
  const findCellIndexFromPointer = (pointerIndex: number): number => {
    if (pointerIndex < 0 || pointerIndex >= page.cellPointerArray.length) {
      return -1;
    }

    const pointer = page.cellPointerArray[pointerIndex];
    const pointerValue = pointer.value;

    // Find the cell that starts at the offset pointed to by the cell pointer
    for (let i = 0; i < page.cells.length; i++) {
      if (page.cells[i].offset === pointerValue) {
        return i;
      }
    }

    return -1;
  };

  // Define startScan function before it's used in the useEffect below
  const startScan = () => {
    // Check if we have matching rowids for a binary search-like scan
    if (matchingRowids && matchingRowids.length > 0) {
      // Create a mapping from rowids to cell pointer indices
      const rowidToCellMap = new Map<number, number>();

      // First, map each cell to its rowid
      page.cells.forEach((cell, cellIndex) => {
        rowidToCellMap.set(cell.rowid, cellIndex);
      });

      // Create a mapping from cell indices to cell pointer indices
      const cellToPointerMap = new Map<number, number>();

      // For each cell pointer, find the corresponding cell index
      page.cellPointerArray.forEach((pointer, pointerIndex) => {
        const cellIndex = findCellIndexFromPointer(pointerIndex);
        if (cellIndex !== -1) {
          cellToPointerMap.set(cellIndex, pointerIndex);
        }
      });

      // Find the cell pointer indices that correspond to matching rowids
      const matchingIndices: number[] = [];
      matchingRowids.forEach(rowid => {
        const cellIndex = rowidToCellMap.get(rowid);
        if (cellIndex !== undefined) {
          const pointerIndex = cellToPointerMap.get(cellIndex);
          if (pointerIndex !== undefined) {
            matchingIndices.push(pointerIndex);
          }
        }
      });

      // Sort the matching indices to visit them in order
      matchingIndices.sort((a, b) => a - b);

      if (matchingIndices.length > 0) {
        // Set up for binary search-like scan
        setMatchingCellPointerIndices(matchingIndices);
        setCurrentMatchingIndex(0);
        setIsBinarySearchScan(true);

        // Set the initial cell pointer and cell indices
        const initialPointerIndex = matchingIndices[0];
        const initialCellIndex = findCellIndexFromPointer(initialPointerIndex);

        setCurrentCellPointerIndex(initialPointerIndex);
        setCurrentCellIndex(initialCellIndex);
        setIsScanning(true);
        setIsPaused(false);
        setScanComplete(false);
        return;
      }
    }

    // If no matching rowids or no matching indices found, fall back to sequential scan
    setIsBinarySearchScan(false);
    setMatchingCellPointerIndices([]);
    setCurrentMatchingIndex(-1);

    // Find the cell index for the first cell pointer
    const initialCellIndex = findCellIndexFromPointer(0);
    // Update both indices at the same time
    setCurrentCellPointerIndex(0);
    setCurrentCellIndex(initialCellIndex);
    setIsScanning(true);
    setIsPaused(false);
    setScanComplete(false);
  };

  // Reset scan state when page changes
  useEffect(() => {
    setCurrentCellPointerIndex(-1);
    setCurrentCellIndex(-1);
    setIsScanning(false);
    setIsPaused(false);
    setScanComplete(false);
  }, [page.number]);

  // Define resetScan function before it's used in the useEffect below
  const resetScan = () => {
    setCurrentCellPointerIndex(-1);
    setCurrentCellIndex(-1);
    setIsScanning(false);
    setIsPaused(false);
    setScanComplete(false);

    // Reset binary search-like scan state
    setMatchingCellPointerIndices([]);
    setCurrentMatchingIndex(-1);
    setIsBinarySearchScan(false);
  };

  // Call onScanComplete callback when scan is complete
  useEffect(() => {
    if (!isScanning || isPaused || !scanComplete) return;

    // If onScanComplete callback is provided, call it after a short delay
    if (onScanComplete) {
      const timer = setTimeout(() => {
        onScanComplete();
        // Reset scan state for the next page
        resetScan();
      }, 1500); // Give user time to see the completion message

      return () => clearTimeout(timer);
    }
  }, [isScanning, isPaused, scanComplete, onScanComplete]);

  // Handle the scanning animation
  useEffect(() => {
    if (!isScanning || isPaused || scanComplete) return;

    const timer = setTimeout(() => {
      if (isBinarySearchScan) {
        // Binary search-like scan - only visit matching cell pointers
        if (currentMatchingIndex < matchingCellPointerIndices.length - 1) {
          // Move to the next matching cell pointer
          const nextMatchingIndex = currentMatchingIndex + 1;
          const nextPointerIndex = matchingCellPointerIndices[nextMatchingIndex];

          // Find the cell index for the next cell pointer
          const cellIndex = findCellIndexFromPointer(nextPointerIndex);

          // Update all indices
          setCurrentMatchingIndex(nextMatchingIndex);
          setCurrentCellPointerIndex(nextPointerIndex);
          setCurrentCellIndex(cellIndex);
        } else {
          // If we've reached the last matching cell pointer, complete the scan
          setScanComplete(true);
          setIsScanning(false);
        }
      } else {
        // Sequential scan - visit all cell pointers
        if (currentCellPointerIndex < page.cellPointerArray.length - 1) {
          // Move to the next cell pointer
          const nextPointerIndex = currentCellPointerIndex + 1;

          // Find the cell index for the next cell pointer
          const cellIndex = findCellIndexFromPointer(nextPointerIndex);

          // Update both indices at the same time
          setCurrentCellPointerIndex(nextPointerIndex);
          setCurrentCellIndex(cellIndex);
        } else {
          // If we've reached the last cell pointer, complete the scan
          setScanComplete(true);
          setIsScanning(false);
        }
      }
    }, 1000); // 1 second delay between steps

    return () => clearTimeout(timer);
  }, [isScanning, isPaused, scanComplete, currentCellPointerIndex, currentMatchingIndex, isBinarySearchScan, matchingCellPointerIndices, page.cellPointerArray.length]);

  const pauseScan = () => {
    setIsPaused(true);
  };

  const resumeScan = () => {
    setIsPaused(false);
  };

  const stepScan = () => {
    if (isBinarySearchScan) {
      // Binary search-like scan - only visit matching cell pointers
      if (currentMatchingIndex === -1) {
        // We haven't started the scan yet, so start with the first matching cell pointer
        if (matchingCellPointerIndices.length > 0) {
          const initialPointerIndex = matchingCellPointerIndices[0];
          const initialCellIndex = findCellIndexFromPointer(initialPointerIndex);

          setCurrentMatchingIndex(0);
          setCurrentCellPointerIndex(initialPointerIndex);
          setCurrentCellIndex(initialCellIndex);
        }
      } else if (currentMatchingIndex < matchingCellPointerIndices.length - 1) {
        // Move to the next matching cell pointer
        const nextMatchingIndex = currentMatchingIndex + 1;
        const nextPointerIndex = matchingCellPointerIndices[nextMatchingIndex];

        // Find the corresponding cell index
        const cellIndex = findCellIndexFromPointer(nextPointerIndex);

        // Update all indices
        setCurrentMatchingIndex(nextMatchingIndex);
        setCurrentCellPointerIndex(nextPointerIndex);
        setCurrentCellIndex(cellIndex);
      } else {
        // If we've reached the last matching cell pointer, complete the scan
        setScanComplete(true);
      }
    } else {
      // Sequential scan - visit all cell pointers
      if (currentCellPointerIndex === -1) {
        // We haven't started the scan yet, so start with the first cell pointer
        const initialCellIndex = findCellIndexFromPointer(0);
        // Update both indices at the same time
        setCurrentCellPointerIndex(0);
        setCurrentCellIndex(initialCellIndex);
      } else if (currentCellPointerIndex < page.cellPointerArray.length - 1) {
        // Move to the next cell pointer
        const nextPointerIndex = currentCellPointerIndex + 1;
        // Find the corresponding cell index
        const cellIndex = findCellIndexFromPointer(nextPointerIndex);
        // Update both indices at the same time
        setCurrentCellPointerIndex(nextPointerIndex);
        setCurrentCellIndex(cellIndex);
      } else {
        // If we've reached the last cell pointer, complete the scan
        setScanComplete(true);
      }
    }
  };

  const getCurrentCellPointer = (): SqliteCellPointer | null => {
    if (currentCellPointerIndex >= 0 && currentCellPointerIndex < page.cellPointerArray.length) {
      return page.cellPointerArray[currentCellPointerIndex];
    }
    return null;
  };

  const getCurrentCell = (): TableLeafCell | null => {
    if (currentCellIndex >= 0 && currentCellIndex < page.cells.length) {
      return page.cells[currentCellIndex] as TableLeafCell;
    }
    return null;
  };

  const currentCellPointer = getCurrentCellPointer();
  const currentCell = getCurrentCell();

  return (
    <InfoContent>
      <InfoHeader>Full Table Scan</InfoHeader>

      {/* Navigation controls for table pages */}
      {tableName && currentPageIndex !== undefined && totalPages !== undefined && onPrevPage && onNextPage && onBackToTables && (
        <div className="bg-gray-100 p-3 rounded-md mb-4">
          <div className="text-center mb-2">
            <p className="text-sm font-medium text-gray-700">
              Use the buttons below to navigate between pages of the {tableName} table
            </p>
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={onBackToTables}
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              Back to Tables
            </button>

            <div className="text-center">
              <h3 className="font-medium">{tableName}</h3>
              <p className="text-sm text-gray-600">
                Page {currentPageIndex + 1} of {totalPages}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onPrevPage}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center"
                disabled={currentPageIndex === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Previous Page
              </button>
              <button
                onClick={onNextPage}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center"
                disabled={currentPageIndex === totalPages - 1}
              >
                Next Page
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-100 p-3 rounded-md">
        <div className="mb-3">
          <p className="font-medium">Page: {page.number}</p>
          <p className="text-sm text-gray-600">Table: {page.description || "Unknown"}</p>
          <p className="text-sm text-gray-600">Total Cell Pointers: {page.cellPointerArray.length}</p>

          {/* Show information about matching rows if we have matchingRowids */}
          {matchingRowids && matchingRowids.length > 0 && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
              <p className="text-sm font-medium text-green-800">
                This page contains rows matching your query
              </p>
              <p className="text-xs text-green-700">
                {page.cells.filter(cell => matchingRowids.includes(cell.rowid)).length} of {page.cells.length} rows on this page match your query
              </p>
              <p className="text-xs text-green-700 mt-1">
                Matching rowids: {page.cells
                  .filter(cell => matchingRowids.includes(cell.rowid))
                  .map(cell => cell.rowid)
                  .join(', ')}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          {!isScanning && !scanComplete ? (
            <button
              onClick={startScan}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Start Scan
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={resumeScan}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Resume
                </button>
              ) : (
                <button
                  onClick={pauseScan}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  disabled={scanComplete}
                >
                  Pause
                </button>
              )}
              <button
                onClick={stepScan}
                className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                disabled={scanComplete}
              >
                Step
              </button>
              <button
                onClick={resetScan}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Reset
              </button>
            </>
          )}
        </div>

        <div className="border border-gray-300 rounded p-2 bg-white">
          <h3 className="font-medium mb-2">Scan Status</h3>
          {currentCellPointerIndex === -1 && currentCellIndex === -1 ? (
            <p>Ready to scan. Click "Start Scan" to begin.</p>
          ) : scanComplete ? (
            <div>
              {isBinarySearchScan ? (
                <p className="text-green-600">
                  Binary search scan complete! All {matchingCellPointerIndices.length} matching cell pointers scanned.
                </p>
              ) : (
                <p className="text-green-600">
                  Sequential scan complete! All {page.cellPointerArray.length} cell pointers scanned.
                </p>
              )}
              {onScanComplete && (
                <p className="text-sm text-blue-600 mt-1">
                  You can click the "Next Page" button to move to the next page, or wait for automatic progression.
                </p>
              )}
            </div>
          ) : (
            <div>
              {isBinarySearchScan ? (
                <div>
                  <p className="text-blue-600 font-medium">Binary Search-like Scan</p>
                  <p>
                    Scanning matching cell pointer {currentMatchingIndex + 1} of {matchingCellPointerIndices.length}
                    {isPaused && " (Paused)"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Cell pointer index: {currentCellPointerIndex} (out of {page.cellPointerArray.length} total)
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium">Sequential Scan</p>
                  <p>
                    Scanning cell pointer {currentCellPointerIndex + 1} of {page.cellPointerArray.length}
                    {isPaused && " (Paused)"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {currentCellPointer && (
          <div className="mt-4 border border-gray-300 rounded p-2 bg-white">
            <h3 className="font-medium mb-2">Current Cell Pointer</h3>
            <p>Value: {currentCellPointer.value} (points to cell data)</p>
            <p className="text-sm text-gray-600">
              Offset: {currentCellPointer.offset}, Length: {currentCellPointer.length}
            </p>
          </div>
        )}

        {currentCell && (
          <div className="mt-4 border border-gray-300 rounded p-2 bg-white">
            <h3 className="font-medium mb-2">Current Cell</h3>
            <p>Rowid: {currentCell.rowid}</p>
            <p className="text-sm text-gray-600">
              Offset: {currentCell.offset}, Length: {currentCell.length}
            </p>
            <div className="mt-2">
              <h4 className="font-medium text-sm mb-1">Cell Content:</h4>
              <HexViewer buffer={currentCell.content} />
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${isBinarySearchScan ? 'bg-purple-600' : 'bg-blue-600'}`}
              style={{ 
                width: isBinarySearchScan
                  ? `${scanComplete ? 100 : (currentMatchingIndex + 1) / matchingCellPointerIndices.length * 100}%`
                  : `${scanComplete ? 100 : (currentCellPointerIndex + 1) / page.cellPointerArray.length * 100}%`,
                transition: "width 0.5s ease-in-out"
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            {isBinarySearchScan && (
              <p className="text-xs text-purple-600">
                Binary search-like scan: only visiting matching rowids
              </p>
            )}
            <p className="text-xs text-right">
              {scanComplete
                ? isBinarySearchScan
                  ? `${matchingCellPointerIndices.length} / ${matchingCellPointerIndices.length} matching cell pointers`
                  : `${page.cellPointerArray.length} / ${page.cellPointerArray.length} cell pointers`
                : isBinarySearchScan
                  ? `${currentMatchingIndex + 1} / ${matchingCellPointerIndices.length} matching cell pointers`
                  : `${currentCellPointerIndex + 1} / ${page.cellPointerArray.length} cell pointers`
              }
            </p>
          </div>
        </div>
      </div>
    </InfoContent>
  );
}
