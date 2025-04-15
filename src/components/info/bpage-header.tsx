import { DatabaseBTreePage } from "../../type";
import { HexViewer } from "../hex-viewer";
import { InfoContent, InfoHeader, InfoTableSizeTooltip } from "../info";

export function BPageHeaderInfo({ page }: { page: DatabaseBTreePage }) {
  const headerOffset = page.number === 1 ? 100 : 0;

  return (
    <InfoContent>
      <InfoHeader
        fileOffset={page.data.byteLength * (page.number - 1) + headerOffset}
        pageOffset={headerOffset}
        length={page.type.includes("Interior") ? 12 : 8}
      >
        Page Header
      </InfoHeader>

      <p>
        The b-tree page header is 8 bytes in size for leaf pages and 12 bytes
        for interior pages. All multibyte values in the page header are
        big-endian.
      </p>

      <HexViewer buffer={page.data.slice(headerOffset, headerOffset + 12)} />

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
            <td>1</td>
            <td>Page Type</td>
            <td>{page.type}</td>
          </tr>
          <tr>
            <td>2</td>
            <td>First Free Block</td>
            <td>{page.header.firstFreeblockOffset}</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Cell Count</td>
            <td>{page.header.cellCount}</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Cell Content Area</td>
            <td>{page.header.cellPointerArrayOffset}</td>
          </tr>
          <tr>
            <td>1</td>
            <td>Fragment Free Bytes</td>
            <td>{page.header.fragmentFreeBytes}</td>
          </tr>
          {page.type.includes("Interior") && (
            <tr>
              <td>4</td>
              <td>Right Child Page Number</td>
              <td>{page.header.rightChildPageNumber}</td>
            </tr>
          )}
        </tbody>
      </table>
    </InfoContent>
  );
}
