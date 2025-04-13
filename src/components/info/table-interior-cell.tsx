import { SqliteTableInteriorCell } from "../../type";
import { HexViewer } from "../hex-viewer";
import { InfoContent, InfoHeader } from "../info";

export function TableInteriorCellInfo({
  cell,
}: {
  cell: SqliteTableInteriorCell;
}) {
  return (
    <InfoContent>
      <InfoHeader>Table Interior Cell</InfoHeader>
      <div>
        Offset: {cell.offset} | Length: {cell.length}
      </div>

      <HexViewer buffer={cell.content} />

      <div>
        <h2 className="font-bold">Explaination</h2>
        <p>
          For rowid {"<"} {cell.rowid} goes to page {cell.pageNumber}
        </p>
      </div>

      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-[25px]"></th>
            <th>Description</th>
            <th>Value</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td className="text-center">4</td>
            <td>Page Number</td>
            <td>{cell.pageNumber}</td>
          </tr>
          <tr>
            <td></td>
            <td>Rowid</td>
            <td>{cell.rowid}</td>
          </tr>
        </tbody>
      </table>
    </InfoContent>
  );
}
