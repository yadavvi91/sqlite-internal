// This is AI generated code. Don't ask me how it works lol
import { useState, useEffect } from "react";

interface FileDropZoneProps {
  onFileLoad: (buffer: ArrayBuffer) => void;
  children?: React.ReactNode;
  className?: string;
}

function FileDropZone({ onFileLoad, children, className }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const buffer = await file.arrayBuffer();
      onFileLoad(buffer);
    }
  };

  // We'll use a single set of handlers attached at the document level
  // to capture drag events anywhere on the page
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const buffer = await files[0].arrayBuffer();
        onFileLoad(buffer);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only set isDragging to false when the drag leaves the document
      if (e.target === document.documentElement) {
        setIsDragging(false);
      }
    };

    // Attach handlers to the document
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);
    document.addEventListener("dragleave", handleDragLeave);

    return () => {
      // Clean up handlers when component unmounts
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
      document.removeEventListener("dragleave", handleDragLeave);
    };
  }, [onFileLoad]);

  return (
    <div
      className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
        isDragging ? "bg-blue-50/20 border-2 border-dashed border-blue-500" : ""
      } ${className || ""}`}
      // Removed redundant event handlers from this div
    >
      <div
        className={`flex flex-col items-center justify-center p-10 rounded-lg text-center max-w-md w-full transition-all duration-300 border border-black bg-white`}
      >
        {children}

        <p className="text-base text-gray-700 mb-2.5">
          Drop your SQLite database file here
        </p>
        <p className="text-sm text-gray-500 mb-5">or</p>

        <div className="relative mt-5 overflow-hidden inline-block">
          <button className="inline-block px-5 py-2.5 bg-gray-900 text-white font-bold rounded cursor-pointer text-base transition-colors hover:bg-blue-700">
            Select File
          </button>
          <input
            type="file"
            onChange={handleFileChange}
            className="absolute opacity-0 right-0 top-0 text-[100px] cursor-pointer"
            accept=".db,.sqlite,.sqlite3,.db3"
          />
        </div>

        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-lg text-xl font-bold text-blue-600">
            Drop file here to upload
          </div>
        )}
      </div>
    </div>
  );
}

export default FileDropZone;
