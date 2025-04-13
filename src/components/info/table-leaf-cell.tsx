import { SqliteTableLeafCell } from "../../type";
import { HexViewer } from "../hex-viewer";

export function TableLeafCellInfo({ cell }: { cell: SqliteTableLeafCell }) {
  return (
    <div className="font-sans max-w-[350px] flex flex-col gap-4">
      <h1 className="text-lg font-bold">Table Leaf Cell</h1>
      <div>
        Offset: {cell.offset} | Length: {cell.length}
      </div>

      <table className="table w-full">
        <thead>
          <tr>
            <th></th>
            <th>Description</th>
            <th>Value</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td></td>
            <td>Payload Size</td>
            <td>{cell.size}</td>
          </tr>
          <tr>
            <td></td>
            <td>Rowid</td>
            <td>{cell.rowid}</td>
          </tr>

          <tr>
            <td></td>
            <td colSpan={2}>Payload</td>
          </tr>

          <tr>
            <td colSpan={3}>
              <HexViewer buffer={cell.payload} />
            </td>
          </tr>

          {cell.overflowPageNumber > 0 && (
            <tr>
              <td></td>
              <td>Overflow Page</td>
              <td>{cell.overflowPageNumber}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
