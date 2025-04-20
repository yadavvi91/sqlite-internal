import { useCallback, useEffect, useState } from "react";
import { PageList } from "./page-list";
import { parseDatabase } from "./parser/main";
import { Database as SQLiteDatabase } from "sql.js";
import {} from "sql.js";
import { SQLEditor } from "./components/editor";
import { Database } from "./type";

interface ViewerProps {
  database: SQLiteDatabase;
}

export default function Viewer({ database }: ViewerProps) {
  const [db, setDatabase] = useState<Database | null>(null);

  // Make the SQLiteDatabase instance available on the window object
  // This is a workaround to allow the IndexQuerySearch component to access it
  useEffect(() => {
    (window as any).sqliteDatabase = database;

    // Clean up when the component unmounts
    return () => {
      delete (window as any).sqliteDatabase;
    };
  }, [database]);

  const parseDatabaseFromDatabase = useCallback(() => {
    const parsedDatabase = parseDatabase(database.export().buffer);

    // Attaching the table name to each pages
    const dbstat = database.exec("SELECT pageno, name FROM dbstat");
    const descriptions = new Map<number, string>();

    for (const row of dbstat[0].values) {
      const pageNumber = row[0] as number;
      const tableName = row[1] as string;
      descriptions.set(pageNumber, tableName);
    }

    for (const page of parsedDatabase.pages) {
      if (descriptions.has(page.number)) {
        page.description = descriptions.get(page.number);
      }
    }

    return parsedDatabase;
  }, [database]);

  useEffect(() => {
    setDatabase(parseDatabaseFromDatabase());
  }, [parseDatabaseFromDatabase]);

  const onExecute = useCallback(
    (sql: string) => {
      database.exec(sql);
      setDatabase(parseDatabaseFromDatabase());
    },
    [database, parseDatabaseFromDatabase]
  );

  if (!db) {
    return null;
  }

  return (
    <>
      <PageList db={db} />
      <SQLEditor onExecute={onExecute} />
    </>
  );
}
