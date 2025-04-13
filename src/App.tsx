import { useState } from "react";
import Viewer from "./Viewer";
import FileDropZone from "./components/file-drop-zone";
import { InfoProvider } from "./components/info";

function App() {
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);

  return (
    <InfoProvider>
      {fileBuffer ? (
        <Viewer buffer={fileBuffer} />
      ) : (
        <FileDropZone onFileLoad={setFileBuffer}>
          <h2 style={{ color: "#0078d7", marginTop: 0 }}>
            SQLite Database Viewer
          </h2>
        </FileDropZone>
      )}
    </InfoProvider>
  );
}

export default App;
