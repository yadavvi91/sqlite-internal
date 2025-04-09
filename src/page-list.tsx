import { SqliteDatabase } from "./type";

export function PageList({ db }: { db: SqliteDatabase }) {
  return (
    <div className="flex flex-wrap gap-4 p-4">
      {db.pages.map((page, index) => {
        return (
          <div
            onClick={() => {
              window.location.hash = `page${page.pageNumber}`;
            }}
            key={index}
            className="border p-4 rounded w-[200px] hover:bg-gray-100 cursor-pointer text-sm"
          >
            <h3 className="font-bold text-2xl">{page.pageNumber}</h3>
            <p>{page.pageTypeName}</p>
            <p>{page.pageData.length} bytes</p>
          </div>
        );
      })}
    </div>
  );
}
