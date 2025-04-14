import { DatabaseParsedPage, SqliteCellPointer } from "../../type";
import { HexViewer } from "../hex-viewer";
import { InfoContent, InfoHeader } from "../info";

export function CellPointerInfo({
  pointer,
  page,
}: {
  pointer: SqliteCellPointer;
  page: DatabaseParsedPage;
}) {
  return (
    <InfoContent>
      <InfoHeader
        fileOffset={page.data.byteLength * (page.number - 1) + pointer.offset}
        pageOffset={pointer.offset}
        length={pointer.length}
      >
        Cell Pointer
      </InfoHeader>

      <p>
        Cell content is stored in the cell content region of the b-tree page
      </p>

      <HexViewer buffer={pointer.content} />

      <table className="table w-full text-xs">
        <thead>
          <tr>
            <th className="w-[25px]"></th>
            <th>Description</th>
            <th>Value</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td className="text-center">2</td>
            <td>Point to offset</td>
            <td>{pointer.value}</td>
          </tr>
        </tbody>
      </table>
    </InfoContent>
  );
}
