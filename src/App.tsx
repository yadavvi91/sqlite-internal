import { useState, useEffect } from "react";
import Viewer from "./Viewer";

function App() {
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const buffer = await file.arrayBuffer();
      setFileBuffer(buffer);
      console.log("File loaded as buffer:", buffer);
    }
  };

  const handleFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    setFileBuffer(buffer);
    console.log("File loaded as buffer:", buffer);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  useEffect(() => {
    // Add event listeners to the entire document body
    const handleDocumentDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDocumentDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    };

    const handleDocumentDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target === document.documentElement) {
        setIsDragging(false);
      }
    };

    document.addEventListener("dragover", handleDocumentDragOver);
    document.addEventListener("drop", handleDocumentDrop);
    document.addEventListener("dragleave", handleDocumentDragLeave);

    return () => {
      document.removeEventListener("dragover", handleDocumentDragOver);
      document.removeEventListener("drop", handleDocumentDrop);
      document.removeEventListener("dragleave", handleDocumentDragLeave);
    };
  }, []);

  if (fileBuffer) {
    return <Viewer buffer={fileBuffer} />;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: isDragging ? "rgba(0, 0, 255, 0.05)" : "transparent",
        border: isDragging ? "2px dashed blue" : "none",
        transition: "all 0.3s ease",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h2>File Reader</h2>
      <input type="file" onChange={handleFileChange} />
      {isDragging && <p>Drop file here...</p>}
    </div>
  );
}

export default App;
