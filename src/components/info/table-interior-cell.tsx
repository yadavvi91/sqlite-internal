import { DatabaseParsedPage, TableInteriorCell } from "../../type";
import { HexViewer } from "../hex-viewer";
import { InfoContent, InfoHeader, InfoTableSizeTooltip } from "../info";

export function TableInteriorCellInfo({
  cell,
  page,
}: {
  cell: TableInteriorCell;
  page: DatabaseParsedPage;
}) {
  return (
    <InfoContent>
      <InfoHeader
        fileOffset={page.data.byteLength * (page.number - 1) + cell.offset}
        pageOffset={cell.offset}
        length={cell.length}
      >
        Table Interior Cell
      </InfoHeader>

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
            <th className="w-[25px]">
              <InfoTableSizeTooltip />
            </th>
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
            <td>{cell.rowidLength}</td>
            <td>Rowid</td>
            <td>{cell.rowid}</td>
          </tr>
        </tbody>
      </table>
    </InfoContent>
  );
}
