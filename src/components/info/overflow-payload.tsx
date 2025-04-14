import { OverflowPage } from "../../type";
import { InfoContent, InfoHeader, InfoTableSizeTooltip } from "../info";
import { HexViewer } from "../hex-viewer";

export function OverflowPayloadInfo({ page }: { page: OverflowPage }) {
  return (
    <InfoContent>
      <InfoHeader
        fileOffset={
          page.data.byteLength * (page.number - 1) + page.payload.offset
        }
        pageOffset={page.payload.offset}
        length={page.payload.length}
      >
        Overflow Payload
      </InfoHeader>

      <HexViewer buffer={page.payload.content} />

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
            <td>{page.payload.content.byteLength}</td>
            <td>Payload</td>
            <td className="italic">{`<${page.payload.content.byteLength} bytes of payload>`}</td>
          </tr>
        </tbody>
      </table>
    </InfoContent>
  );
}
