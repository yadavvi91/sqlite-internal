import { TableLeafCanvas } from "./components/table-leaf";
import { Database, TableLeafPage } from "./type";

export function PageList({ db }: { db: Database }) {
  return <TableLeafCanvas page={db.pages[1] as TableLeafPage} db={db} />;

  // return (
  //   <div className="flex flex-wrap gap-4 p-4">
  //     {db.pages.map((page, index) => {
  //       return (
  //         <div
  //           key={index}
  //           className="border p-4 rounded w-[200px] hover:bg-gray-100 cursor-pointer text-sm"
  //         >
  //           <h3 className="font-bold text-2xl">{page.number}</h3>
  //           <p>{page.type}</p>
  //           <p>{db.header.pageSize} bytes</p>
  //         </div>
  //       );
  //     })}
  //   </div>
  // );
}
