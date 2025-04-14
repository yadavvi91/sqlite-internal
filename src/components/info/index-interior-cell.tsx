import { useMemo } from "react";
import { DatabaseParsedPage, IndexInteriorCell } from "../../type";
import { InfoContent, InfoHeader, InfoTableSizeTooltip } from "../info";
import { HexViewer } from "../hex-viewer";

export function IndexInteriorCellInfo({
  cell,
  page,
}: {
  cell: IndexInteriorCell;
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
        Index Interior Cell
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
            <td>4</td>
            <td>Left Child Pointer</td>
            <td>{cell.leftChildPagePointer}</td>
          </tr>
          <tr>
            <td>{cell.payloadSizeBytes}</td>
            <td>Payload Size</td>
            <td>{cell.payloadSize}</td>
          </tr>
          <tr>
            <td>{cell.payloadSize}</td>
            <td>Payload</td>
            <td className="italic">{`<${cell.payload.byteLength} bytes of payload>`}</td>
          </tr>
          {cell.overflowPageNumber && (
            <tr>
              <td>4</td>
              <td>Overflow Page</td>
              <td></td>
            </tr>
          )}
        </tbody>
      </table>
    </InfoContent>
  );
}
