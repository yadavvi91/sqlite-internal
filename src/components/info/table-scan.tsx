import { useEffect, useState } from "react";
import { InfoContent, InfoHeader } from "../info";
import { Database, SqliteCellPointer, TableLeafCell, TableLeafPage } from "../../type";
import { useInfoContext } from "../info-context";

interface TableScanInfoProps {
  page: TableLeafPage;
  db: Database;
}

export function TableScanInfo({ page, db }: TableScanInfoProps) {
  const { setInfo } = useInfoContext();
  const [currentCellPointerIndex, setCurrentCellPointerIndex] = useState<number>(-1);
  const [currentCellIndex, setCurrentCellIndex] = useState<number>(-1);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [scanComplete, setScanComplete] = useState<boolean>(false);
  const [scanPhase, setScanPhase] = useState<"pointer" | "cell">("pointer");

  // Update the InfoContext when the current cell pointer index or cell index changes
  useEffect(() => {
    setInfo({
      type: "table-scan",
      page,
      db,
      currentCellIndex: scanPhase === "cell" ? currentCellIndex : -1,
      currentCellPointerIndex: scanPhase === "pointer" ? currentCellPointerIndex : -1,
    });
  }, [currentCellPointerIndex, currentCellIndex, scanPhase, page, db, setInfo]);

  // Reset scan state when page changes
  useEffect(() => {
    setCurrentCellPointerIndex(-1);
    setCurrentCellIndex(-1);
    setIsScanning(false);
    setIsPaused(false);
    setScanComplete(false);
    setScanPhase("pointer");
  }, [page.number]);

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

  // Handle the scanning animation
  useEffect(() => {
    if (!isScanning || isPaused || scanComplete) return;

    const timer = setTimeout(() => {
      if (scanPhase === "pointer") {
        // We're looking at a cell pointer
        // First, follow the current cell pointer to its cell
        const cellIndex = findCellIndexFromPointer(currentCellPointerIndex);
        if (cellIndex !== -1) {
          setCurrentCellIndex(cellIndex);
          setScanPhase("cell");
        } else if (currentCellPointerIndex < page.cellPointerArray.length - 1) {
          // If we can't find the cell, move to the next cell pointer
          setCurrentCellPointerIndex(currentCellPointerIndex + 1);
        } else {
          // If we can't find the cell and we're at the last cell pointer, complete the scan
          setScanComplete(true);
          setIsScanning(false);
        }
      } else {
        // We're looking at a cell
        // After looking at the cell, go back to looking at cell pointers
        setScanPhase("pointer");

        // Move to the next cell pointer if we're not at the last one
        if (currentCellPointerIndex < page.cellPointerArray.length - 1) {
          setCurrentCellPointerIndex(currentCellPointerIndex + 1);
        } else {
          // If we've reached the last cell pointer, complete the scan
          setScanComplete(true);
          setIsScanning(false);
        }
      }
    }, 1000); // 1 second delay between steps

    return () => clearTimeout(timer);
  }, [isScanning, isPaused, scanComplete, scanPhase, currentCellPointerIndex, currentCellIndex, page.cellPointerArray.length, page.cells.length]);

  const startScan = () => {
    setCurrentCellPointerIndex(0);
    setCurrentCellIndex(-1);
    setScanPhase("pointer");
    setIsScanning(true);
    setIsPaused(false);
    setScanComplete(false);
  };

  const pauseScan = () => {
    setIsPaused(true);
  };

  const resumeScan = () => {
    setIsPaused(false);
  };

  const stepScan = () => {
    if (scanPhase === "pointer") {
      if (currentCellPointerIndex === -1) {
        // We haven't started the scan yet, so start with the first cell pointer
        setCurrentCellPointerIndex(0);
      } else {
        // Follow the current cell pointer to its cell
        const cellIndex = findCellIndexFromPointer(currentCellPointerIndex);
        if (cellIndex !== -1) {
          setCurrentCellIndex(cellIndex);
          setScanPhase("cell");
        } else if (currentCellPointerIndex < page.cellPointerArray.length - 1) {
          // If we can't find the cell, move to the next cell pointer
          setCurrentCellPointerIndex(currentCellPointerIndex + 1);
        } else {
          // If we can't find the cell and we're at the last cell pointer, complete the scan
          setScanComplete(true);
        }
      }
    } else {
      // We're looking at a cell
      // After looking at the cell, go back to looking at cell pointers
      setScanPhase("pointer");

      // Move to the next cell pointer if we're not at the last one
      if (currentCellPointerIndex < page.cellPointerArray.length - 1) {
        setCurrentCellPointerIndex(currentCellPointerIndex + 1);
      } else {
        // If we've reached the last cell pointer, complete the scan
        setScanComplete(true);
      }
    }
  };

  const resetScan = () => {
    setCurrentCellPointerIndex(-1);
    setCurrentCellIndex(-1);
    setScanPhase("pointer");
    setIsScanning(false);
    setIsPaused(false);
    setScanComplete(false);
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

      <div className="bg-gray-100 p-3 rounded-md">
        <div className="mb-3">
          <p className="font-medium">Page: {page.number}</p>
          <p className="text-sm text-gray-600">Table: {page.description || "Unknown"}</p>
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
            <p className="text-green-600">Scan complete! All {page.cellPointerArray.length} cell pointers scanned.</p>
          ) : (
            <p>
              {scanPhase === "pointer" ? (
                <>
                  Reading cell pointer {currentCellPointerIndex + 1} of {page.cellPointerArray.length}
                  {isPaused && " (Paused)"}
                </>
              ) : (
                <>
                  Following pointer to cell data
                  {isPaused && " (Paused)"}
                </>
              )}
            </p>
          )}
        </div>

        {currentCellPointer && scanPhase === "pointer" && (
          <div className="mt-4 border border-gray-300 rounded p-2 bg-white">
            <h3 className="font-medium mb-2">Current Cell Pointer</h3>
            <p>Value: {currentCellPointer.value} (points to cell data)</p>
            <p className="text-sm text-gray-600">
              Offset: {currentCellPointer.offset}, Length: {currentCellPointer.length}
            </p>
          </div>
        )}

        {currentCell && scanPhase === "cell" && (
          <div className="mt-4 border border-gray-300 rounded p-2 bg-white">
            <h3 className="font-medium mb-2">Current Cell</h3>
            <p>Rowid: {currentCell.rowid}</p>
            <p className="text-sm text-gray-600">
              Offset: {currentCell.offset}, Length: {currentCell.length}
            </p>
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
