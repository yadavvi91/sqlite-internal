import { useState } from "react";
import Viewer from "./Viewer";
import FileDropZone from "./components/file-drop-zone";
import { InfoProvider } from "./components/info";
import LoadSampleDatabase from "./components/load-sample-database";

function App() {
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);

  return (
    <InfoProvider>
      {fileBuffer ? (
        <Viewer buffer={fileBuffer} />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen p-5 gap-4">
          <LoadSampleDatabase onFileLoad={setFileBuffer} />
          <FileDropZone onFileLoad={setFileBuffer}>
            <h2 className="mt-0 text-blue-600">SQLite Database Viewer</h2>
          </FileDropZone>
        </div>
      )}
    </InfoProvider>
  );
}

export default App;
