import { useEffect, useState } from "react";
import { InfoContent, InfoHeader } from "../info";
import { Database, SqliteCellPointer, TableLeafCell, TableLeafPage } from "../../type";
import { useInfoContext } from "../info-context";
import { HexViewer } from "../hex-viewer";

interface TableScanInfoProps {
  page: TableLeafPage;
  db: Database;
  onScanComplete?: () => void;
}

export function TableScanInfo({ page, db, onScanComplete }: TableScanInfoProps) {
  const { setInfo } = useInfoContext();
  const [currentCellPointerIndex, setCurrentCellPointerIndex] = useState<number>(-1);
  const [currentCellIndex, setCurrentCellIndex] = useState<number>(-1);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [scanComplete, setScanComplete] = useState<boolean>(false);
  // No longer need scanPhase since we're highlighting both at the same time

  // Update the InfoContext when the current cell pointer index or cell index changes
  useEffect(() => {
    setInfo({
      type: "table-scan",
      page,
      db,
      currentCellIndex,
      currentCellPointerIndex,
    });
  }, [currentCellPointerIndex, currentCellIndex, page, db, setInfo]);

  // Reset scan state when page changes
  useEffect(() => {
    setCurrentCellPointerIndex(-1);
    setCurrentCellIndex(-1);
    setIsScanning(false);
    setIsPaused(false);
    setScanComplete(false);
  }, [page.number]);

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
  }, [isScanning, isPaused, scanComplete, onScanComplete, resetScan]);

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

  const resetScan = () => {
    setCurrentCellPointerIndex(-1);
    setCurrentCellIndex(-1);
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
