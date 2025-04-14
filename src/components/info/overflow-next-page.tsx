import { OverflowPage } from "../../type";
import { InfoContent, InfoHeader, InfoTableSizeTooltip } from "../info";
import { HexViewer } from "../hex-viewer";

export function OverflowNextPageInfo({ page }: { page: OverflowPage }) {
  return (
    <InfoContent>
      <InfoHeader
        fileOffset={
          page.data.byteLength * (page.number - 1) + page.payload.offset
        }
        pageOffset={page.payload.offset}
        length={page.payload.length}
      >
        Overflow Next Page
      </InfoHeader>

      <HexViewer buffer={page.data.slice(0, 4)} />

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
            <td>Next Page Number</td>
            <td>{page.nextPage}</td>
          </tr>
        </tbody>
      </table>
    </InfoContent>
  );
}
