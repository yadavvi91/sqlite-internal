import { useEffect, useState } from "react";
import { TableLeafCanvas } from "./components/table-leaf";
import { Database, DatabaseParsedPage } from "./type";
import { OverflowCanvas } from "./components/overflow-canvas";

export function PageList({ db }: { db: Database }) {
  const [selectedPage, setSelectedPage] = useState<DatabaseParsedPage | null>(
    null
  );

  useEffect(() => {
    const handleHashChange = () => {
      // Current hash
      const hash = window.location.hash.slice(1);

      // Parsing the hash
      const parsedHash = new URLSearchParams(hash);

      const pageNumber = parsedHash.get("page");
      setSelectedPage(db.pages[Number(pageNumber) - 1]);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [db]);

  if (selectedPage) {
    if (
      selectedPage.type === "Table Leaf" ||
      selectedPage.type === "Table Interior" ||
      selectedPage.type === "Index Leaf" ||
      selectedPage.type === "Index Interior"
    ) {
      return <TableLeafCanvas page={selectedPage} db={db} />;
    } else if (selectedPage.type === "Overflow") {
      return <OverflowCanvas page={selectedPage} db={db} />;
    }

    return <div>Some unknown page</div>;
  }

  return (
    <div className="flex flex-wrap gap-4 p-4">
      {db.pages.map((page, index) => {
        return (
          <a
            href={`#page=${page.number}`}
            key={index}
            className="bg-white border p-4 rounded w-[180px] hover:bg-gray-100 cursor-pointer text-sm"
          >
            <h3 className="font-bold text-2xl">{page.number}</h3>
            <p>{page.type}</p>
            <p>{db.header.pageSize} bytes</p>
          </a>
        );
      })}
    </div>
  );
}
