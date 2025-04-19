import { useEffect, useState } from "react";
import { InfoContent, InfoHeader } from "../info";
import { Database, TableLeafCell, TableLeafPage } from "../../type";
import { useInfoContext } from "../info-context";

interface TableScanInfoProps {
  page: TableLeafPage;
  db: Database;
}

export function TableScanInfo({ page, db }: TableScanInfoProps) {
  const { setInfo } = useInfoContext();
  const [currentCellIndex, setCurrentCellIndex] = useState<number>(-1);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [scanComplete, setScanComplete] = useState<boolean>(false);

  // Update the InfoContext when the current cell index changes
  useEffect(() => {
    setInfo({
      type: "table-scan",
      page,
      db,
      currentCellIndex,
    });
  }, [currentCellIndex, page, db, setInfo]);

  // Reset scan state when page changes
  useEffect(() => {
    setCurrentCellIndex(-1);
    setIsScanning(false);
    setIsPaused(false);
    setScanComplete(false);
  }, [page.number]);

  // Handle the scanning animation
  useEffect(() => {
    if (!isScanning || isPaused || scanComplete) return;

    const timer = setTimeout(() => {
      if (currentCellIndex < page.cells.length - 1) {
        setCurrentCellIndex(currentCellIndex + 1);
      } else {
        setScanComplete(true);
        setIsScanning(false);
      }
    }, 1000); // 1 second delay between cells

    return () => clearTimeout(timer);
  }, [isScanning, isPaused, currentCellIndex, page.cells.length, scanComplete]);

  const startScan = () => {
    setCurrentCellIndex(-1);
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
    if (currentCellIndex < page.cells.length - 1) {
      setCurrentCellIndex(currentCellIndex + 1);
    } else {
      setScanComplete(true);
    }
  };

  const resetScan = () => {
    setCurrentCellIndex(-1);
    setIsScanning(false);
    setIsPaused(false);
    setScanComplete(false);
  };

  const getCurrentCell = (): TableLeafCell | null => {
    if (currentCellIndex >= 0 && currentCellIndex < page.cells.length) {
      return page.cells[currentCellIndex] as TableLeafCell;
    }
    return null;
  };

  const currentCell = getCurrentCell();

  return (
    <InfoContent>
      <InfoHeader>Full Table Scan</InfoHeader>

      <div className="bg-gray-100 p-3 rounded-md">
        <div className="mb-3">
          <p className="font-medium">Page: {page.number}</p>
          <p className="text-sm text-gray-600">Table: {page.description || "Unknown"}</p>
          <p className="text-sm text-gray-600">Total Cells: {page.cells.length}</p>
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
          {currentCellIndex === -1 ? (
            <p>Ready to scan. Click "Start Scan" to begin.</p>
          ) : scanComplete ? (
            <p className="text-green-600">Scan complete! All {page.cells.length} cells scanned.</p>
          ) : (
            <p>
              Scanning cell {currentCellIndex + 1} of {page.cells.length}
              {isPaused && " (Paused)"}
            </p>
          )}
        </div>

        {currentCell && (
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
                width: `${scanComplete ? 100 : (currentCellIndex + 1) / page.cells.length * 100}%`,
                transition: "width 0.5s ease-in-out"
              }}
            ></div>
          </div>
          <p className="text-xs text-right mt-1">
            {currentCellIndex + 1} / {page.cells.length} cells
          </p>
        </div>
      </div>
    </InfoContent>
  );
}
