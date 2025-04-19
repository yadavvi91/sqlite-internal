import { useState } from "react";
import Viewer from "./Viewer";
import FileDropZone from "./components/file-drop-zone";
import { InfoProvider } from "./components/info";
import LoadSampleDatabase from "./components/load-sample-database";
import { Database } from "sql.js";

function App() {
  const [database, setDatabase] = useState<Database | null>(null);

  const onDatabaseLoadFromBuffer = async (buffer: ArrayBuffer) => {
    window
      .initSqlJs({
        locateFile: (file) => `/sqljs/${file}`,
      })
      .then((sqlite) => {
        setDatabase(new sqlite.Database(new Uint8Array(buffer)));
      });
  };

  return (
    <InfoProvider>
      {database ? (
        <Viewer database={database} />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen p-5 gap-4">
          <div>
            <LoadSampleDatabase onFileLoad={onDatabaseLoadFromBuffer} />
          </div>
          <FileDropZone onFileLoad={onDatabaseLoadFromBuffer}>
            <h2 className="mt-0 text-blue-600">SQLite Database Viewer</h2>
          </FileDropZone>
        </div>
      )}
    </InfoProvider>
  );
}

export default App;
