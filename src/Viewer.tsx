import { useMemo } from "react";
import { PageList } from "./page-list";
import { parseDatabase } from "./parser/main";
import { Database } from "sql.js";

interface ViewerProps {
  database: Database;
}

export default function Viewer({ database }: ViewerProps) {
  const db = useMemo(() => {
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

  return <PageList db={db} />;
}
