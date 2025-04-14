import { useMemo } from "react";
import { DatabaseParsedPage, IndexLeafCell } from "../../type";
import { InfoContent, InfoHeader, InfoTableSizeTooltip } from "../info";
import { HexViewer } from "../hex-viewer";

export function IndexLeafCellInfo({
  cell,
  page,
}: {
  cell: IndexLeafCell;
  page: DatabaseParsedPage;
}) {
  const buffer = useMemo(() => {
    return page.data.slice(cell.offset, cell.offset + cell.length);
  }, [page, cell]);

  return (
    <InfoContent>
      <InfoHeader
        fileOffset={page.data.byteLength * (page.number - 1) + cell.offset}
        pageOffset={cell.offset}
        length={cell.length}
      >
        Index Leaf Cell
      </InfoHeader>

      <HexViewer buffer={buffer} />

      <table className="table w-full text-xs">
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
            <td>{cell.payloadSizeLength}</td>
            <td>Payload Size</td>
            <td>{cell.payloadSize}</td>
          </tr>
          <tr>
            <td>{cell.payload.byteLength}</td>
            <td>Payload</td>
            <td className="italic">{`<${cell.payload.byteLength} bytes of payload>`}</td>
          </tr>
          {cell.overflowPageNumber && (
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
