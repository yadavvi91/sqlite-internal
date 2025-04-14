import { TableLeafCell } from "../../type";
import { HexViewer } from "../hex-viewer";
import { InfoContent, InfoHeader, InfoTableSizeTooltip } from "../info";

export function TableLeafCellInfo({ cell }: { cell: TableLeafCell }) {
  return (
    <InfoContent>
      <InfoHeader>Table Leaf Cell</InfoHeader>
      <div>
        Offset: {cell.offset} | Length: {cell.length}
      </div>

      <HexViewer buffer={cell.content} />

      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-[45px] text-right">
              <InfoTableSizeTooltip />
            </th>
            <th>Description</th>
            <th>Value</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>{cell.payloadSizeLength}</td>
            <td>Payload Size</td>
            <td>{cell.size}</td>
          </tr>
          <tr>
            <td>{cell.rowidLength}</td>
            <td>Rowid</td>
            <td>{cell.rowid}</td>
          </tr>

          <tr>
            <td>{cell.payload.byteLength}</td>
            <td>Payload</td>
            <td className="italic">{`<${cell.payload.byteLength} bytes of payload>`}</td>
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
    </InfoContent>
  );
}
