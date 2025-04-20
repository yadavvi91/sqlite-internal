import { useEffect, useState } from "react";
import { TableLeafCanvas } from "./components/table-leaf";
import { Database, DatabaseParsedPage } from "./type";
import { OverflowCanvas } from "./components/overflow-canvas";

export function PageList({ db }: { db: Database }) {
  const [selectedPageNumber, setSelectedPageNumber] = useState<number>(0);

  useEffect(() => {
    const handleHashChange = () => {
      // Current hash
      const hash = window.location.hash.slice(1);

      // Parsing the hash
      const parsedHash = new URLSearchParams(hash);

      const pageNumber = parsedHash.get("page");
      setSelectedPageNumber(Number(pageNumber));
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [db]);

  if (selectedPageNumber && db.pages[selectedPageNumber - 1]) {
    const selectedPage = db.pages[selectedPageNumber - 1] as DatabaseParsedPage;

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
            className="bg-white border p-4 rounded w-[180px] hover:border-black cursor-pointer text-sm overflow-hidden"
          >
            <h3 className="font-bold text-2xl">{page.number}</h3>
            <p className="text-sm">{page.type}</p>
            <p className="text-sm line-clamp-1 text-ellipsis overflow-hidden text-blue-700">
              {page.description}
            </p>
          </a>
        );
      })}
    </div>
  );
}
