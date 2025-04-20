import { useCallback, useState } from "react";
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
          <div className="flex gap-2 w-full max-w-md">
            <LoadSampleDatabase
              text="Sample Database"
              file={"/chinook.db"}
              onFileLoad={onDatabaseLoadFromBuffer}
            />
            <LoadSampleDatabase
              text="Blank Database"
              file={"/empty.db"}
              onFileLoad={onDatabaseLoadFromBuffer}
            />
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
