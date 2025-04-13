import { DatabaseHeader, DatabaseParsedPage } from "../../type";
import { HexViewer } from "../hex-viewer";

export function DatabaseHeaderInfo({
  header,
  page,
}: {
  header: DatabaseHeader;
  page: DatabaseParsedPage;
}) {
  return (
    <div className="font-sans max-w-[350px] flex flex-col gap-4">
      <h1 className="text-lg font-bold">Database Header</h1>

      <p>
        The first 100 bytes of the database file comprise the database file
        header.
      </p>

      <HexViewer buffer={page.data.slice(0, 100)} />

      <table className="table w-full text-xs">
        <thead>
          <tr>
            <th className="w-42">Description</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Header String</td>
            <td>SQLite Format 3\000</td>
          </tr>
          <tr>
            <td>Page Size</td>
            <td>
              {header.pageSize.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </td>
          </tr>
          <tr>
            <td>File Format Write Version</td>
            <td>{header.fileFormatWriteVersion}</td>
          </tr>
          <tr>
            <td>File Format Read Version</td>
            <td>{header.fileFormatReadVersion}</td>
          </tr>
          <tr>
            <td>Reserved Space</td>
            <td>{header.reservedSpace}</td>
          </tr>
          <tr>
            <td>Max Payload fraction</td>
            <td>{header.maxPageSize}</td>
          </tr>
          <tr>
            <td>Min Payload fraction</td>
            <td>{header.writeVersion}</td>
          </tr>
          <tr>
            <td>Leaf Payload fraction</td>
            <td>{header.readVersion}</td>
          </tr>
          <tr>
            <td>File Change Counter</td>
            <td>{header.fileChangeCounter}</td>
          </tr>
          <tr>
            <td>Total Page</td>
            <td>
              {header.pageCount.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </td>
          </tr>
          <tr>
            <td>First Free Page</td>
            <td>{header.firstFreelistPage}</td>
          </tr>
          <tr>
            <td>Total Free Pages</td>
            <td>{header.totalFreelistPages}</td>
          </tr>
          <tr>
            <td>Schema Cookie</td>
            <td>{header.schemaCookie}</td>
          </tr>
          <tr>
            <td>Schema Format Number</td>
            <td>{header.schemaFormatNumber}</td>
          </tr>
          <tr>
            <td>Page Cache Size</td>
            <td>xxx</td>
          </tr>
          <tr>
            <td>Largest Root b-tree Page</td>
            <td>xxx</td>
          </tr>
          <tr>
            <td>Text Encoding</td>
            <td>xxx</td>
          </tr>
          <tr>
            <td>User Version</td>
            <td>xxx</td>
          </tr>
          <tr>
            <td>Incremental Vacuum</td>
            <td>xxx</td>
          </tr>
          <tr>
            <td>Application ID</td>
            <td>xxx</td>
          </tr>
          <tr>
            <td>Reserved</td>
            <td>xxx</td>
          </tr>
          <tr>
            <td>Version Valid for</td>
            <td>xxx</td>
          </tr>
          <tr>
            <td>SQLite Version Number</td>
            <td>xxx</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
