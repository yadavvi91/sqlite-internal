import { useEffect, useMemo, useState } from "react";
import { parseSqlite } from "./parser";
import { PageList } from "./page-list";
import { SqlitePage } from "./type";
import { PageTableInterior, PageTableLeaf } from "./page-detail";

interface ViewerProps {
  buffer: ArrayBuffer;
}

export default function Viewer({ buffer }: ViewerProps) {
  const [selectedPage, setSelectedPage] = useState<SqlitePage>();

  const db = useMemo(() => {
    return parseSqlite(buffer);
  }, [buffer]);

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.substring(1);

      if (hash.startsWith("page")) {
        const pageNumber = parseInt(hash.split("-")[0].substring(4), 10);
        if (!isNaN(pageNumber)) {
          const page = db.pages[pageNumber - 1];
          if (page) {
            setSelectedPage(page);
          }
        }
        return;
      } else {
        setSelectedPage(undefined);
      }
    };

    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, [db]);

  if (selectedPage) {
    if (selectedPage.pageType === 0x05) {
      return <PageTableInterior db={db} page={selectedPage} />;
    } else if (selectedPage.pageType === 0x0d) {
      return <PageTableLeaf db={db} page={selectedPage} />;
    }
  }

  return (
    <div>
      <PageList db={db} />
    </div>
  );
}
