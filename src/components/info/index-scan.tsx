import { useEffect, useState } from "react";
import { InfoContent, InfoHeader } from "../info";
import { Database, SqliteCellPointer, IndexInteriorPage, IndexLeafPage, IndexInteriorCell, IndexLeafCell } from "../../type";
import { useInfoContext } from "../info-context";
import { HexViewer } from "../hex-viewer";

interface IndexScanInfoProps {
  page: IndexInteriorPage | IndexLeafPage;
  db: Database;
  onScanComplete?: () => void;
  // Navigation props
  indexName?: string;
  currentPageIndex?: number;
  totalPages?: number;
  searchPath?: number[];
  currentPathStep?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onBackToSearch?: () => void;
}

export function IndexScanInfo({ 
  page, 
  db, 
  onScanComplete,
  indexName,
  currentPageIndex,
  totalPages,
  searchPath,
  currentPathStep,
  onPrevPage,
  onNextPage,
  onBackToSearch
}: IndexScanInfoProps) {
  const { setInfo } = useInfoContext();
  const [currentCellPointerIndex, setCurrentCellPointerIndex] = useState<number>(-1);
  const [currentCellIndex, setCurrentCellIndex] = useState<number>(-1);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [scanComplete, setScanComplete] = useState<boolean>(false);

  // Update the InfoContext when the current cell pointer index or cell index changes
  useEffect(() => {
    setInfo({
      type: "index-scan",
      page,
      db,
      currentCellIndex,
      currentCellPointerIndex,
      // Preserve navigation props
      indexName,
      currentPageIndex,
      totalPages,
      searchPath,
      currentPathStep
    });
  }, [currentCellPointerIndex, currentCellIndex, page, db, setInfo, indexName, currentPageIndex, totalPages, searchPath, currentPathStep]);

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
    }, 1000); // 1 second delay between steps

    return () => clearTimeout(timer);
  }, [isScanning, isPaused, scanComplete, currentCellPointerIndex, page.cellPointerArray.length]);

  const pauseScan = () => {
    setIsPaused(true);
  };

  const resumeScan = () => {
    setIsPaused(false);
  };

  const stepScan = () => {
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
  };

  const getCurrentCellPointer = (): SqliteCellPointer | null => {
    if (currentCellPointerIndex >= 0 && currentCellPointerIndex < page.cellPointerArray.length) {
      return page.cellPointerArray[currentCellPointerIndex];
    }
    return null;
  };

  const getCurrentCell = (): IndexInteriorCell | IndexLeafCell | null => {
    if (currentCellIndex >= 0 && currentCellIndex < page.cells.length) {
      return page.cells[currentCellIndex] as (IndexInteriorCell | IndexLeafCell);
    }
    return null;
  };

  const currentCellPointer = getCurrentCellPointer();
  const currentCell = getCurrentCell();

  // Determine if the current cell is an interior or leaf cell
  const isInteriorCell = page.type === "Index Interior";
  const isLeafCell = page.type === "Index Leaf";

  return (
    <InfoContent>
      <InfoHeader>Index Scan</InfoHeader>

      {/* Navigation controls for index pages */}
      {indexName && currentPageIndex !== undefined && totalPages !== undefined && onPrevPage && onNextPage && onBackToSearch && (
        <div className="bg-gray-100 p-3 rounded-md mb-4">
          <div className="text-center mb-2">
            <p className="text-sm font-medium text-gray-700">
              Use the buttons below to navigate between pages of the {indexName} index
            </p>
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={onBackToSearch}
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              Back to Search
            </button>

            <div className="text-center">
              <h3 className="font-medium">{indexName}</h3>
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

      {/* B-tree search path visualization */}
      {searchPath && searchPath.length > 0 && (
        <div className="bg-gray-100 p-3 rounded-md mb-4">
          <h3 className="font-medium mb-2">B-tree Search Path</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {searchPath.map((pageNumber, index) => {
              const isCurrentPage = pageNumber === page.number;
              return (
                <div
                  key={index}
                  className={`p-2 border rounded ${isCurrentPage ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'}`}
                >
                  <p className="font-medium">Page {pageNumber}</p>
                  <p className="text-xs text-gray-600">
                    {index === 0 ? 'Root' : index === searchPath.length - 1 ? 'Leaf' : 'Interior'}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ 
                width: `${((currentPathStep || 0) + 1) / searchPath.length * 100}%`,
                transition: "width 0.5s ease-in-out"
              }}
            ></div>
          </div>
          <p className="text-xs text-right">
            Step {(currentPathStep || 0) + 1} of {searchPath.length}
          </p>
        </div>
      )}

      <div className="bg-gray-100 p-3 rounded-md">
        <div className="mb-3">
          <p className="font-medium">Page: {page.number}</p>
          <p className="text-sm text-gray-600">Type: {page.type}</p>
          <p className="text-sm text-gray-600">Index: {page.description || "Unknown"}</p>
          <p className="text-sm text-gray-600">Total Cell Pointers: {page.cellPointerArray.length}</p>
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
              <p className="text-green-600">Scan complete! All {page.cellPointerArray.length} cell pointers scanned.</p>
              {onScanComplete && (
                <p className="text-sm text-blue-600 mt-1">
                  You can click the "Next Page" button to move to the next page, or wait for automatic progression.
                </p>
              )}
            </div>
          ) : (
            <p>
              Scanning cell pointer {currentCellPointerIndex + 1} of {page.cellPointerArray.length}
              {isPaused && " (Paused)"}
            </p>
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
            {isInteriorCell && (
              <>
                <p>Left Child Page: {(currentCell as IndexInteriorCell).leftChildPagePointer}</p>
                <p>Payload Size: {(currentCell as IndexInteriorCell).payloadSize} bytes</p>
              </>
            )}
            {isLeafCell && (
              <>
                <p>Payload Size: {(currentCell as IndexLeafCell).payloadSize} bytes</p>
              </>
            )}
            <p className="text-sm text-gray-600">
              Offset: {currentCell.offset}, Length: {currentCell.length}
            </p>
            <div className="mt-2">
              <h4 className="font-medium text-sm mb-1">Cell Content:</h4>
              <HexViewer buffer={currentCell.payload} />
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ 
                width: `${scanComplete ? 100 : (currentCellPointerIndex + 1) / page.cellPointerArray.length * 100}%`,
                transition: "width 0.5s ease-in-out"
              }}
            ></div>
          </div>
          <p className="text-xs text-right mt-1">
            {currentCellPointerIndex + 1} / {page.cellPointerArray.length} cell pointers
          </p>
        </div>
      </div>
    </InfoContent>
  );
}