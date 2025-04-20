import { Database, DatabaseHeader, DatabaseParsedPage } from "../../type";
import { HexViewer } from "../hex-viewer";
import { InfoContent, InfoHeader } from "../info";
import { useInfoContext } from "../info-context";

export function DatabaseHeaderInfo({
  header,
  page,
}: {
  header: DatabaseHeader;
  page: DatabaseParsedPage;
}) {
  const { info, setInfo } = useInfoContext();

  const startFullDatabaseTableScan = () => {
    // Use the database object that's already in the info context
    if (info.type === "database-header") {
      setInfo({
        type: "full-database-table-scan",
        db: info.database,
      });
    }
  };

  const startIndexQuerySearch = () => {
    // Use the database object that's already in the info context
    if (info.type === "database-header") {
      setInfo({
        type: "index-query-search",
        db: info.database,
      });
    }
  };

  return (
    <InfoContent>
      <InfoHeader fileOffset={0} length={100} pageOffset={0}>
        Database Header
      </InfoHeader>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={startFullDatabaseTableScan}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          Full Database Table Scan
        </button>
        <button
          onClick={startIndexQuerySearch}
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
        >
          Index Query Search
        </button>
      </div>

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
            <td>SQLite format 3\000</td>
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
            <td>{header.maximumEmbedPayloadFraction}</td>
          </tr>
          <tr>
            <td>Min Payload fraction</td>
            <td>{header.minimumEmbedPayloadFraction}</td>
          </tr>
          <tr>
            <td>Leaf Payload fraction</td>
            <td>{header.leafPayloadFraction}</td>
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
            <td>{header.defaultPageCacheSize}</td>
          </tr>
          <tr>
            <td>Largest Root b-tree Page</td>
            <td>{header.largesRootBTreePage}</td>
          </tr>
          <tr>
            <td>Text Encoding</td>
            <td>{header.textEncoding}</td>
          </tr>
          <tr>
            <td>User Version</td>
            <td>{header.userVersion}</td>
          </tr>
          <tr>
            <td>Incremental Vacuum</td>
            <td>{header.incrementalVacuumMode}</td>
          </tr>
          <tr>
            <td>Application ID</td>
            <td>{header.applicationId}</td>
          </tr>
          <tr>
            <td>Reserved for expansion</td>
            <td>{header.reservedForExpansion}</td>
          </tr>
          <tr>
            <td>Version Valid for</td>
            <td>{header.versionValidFor}</td>
          </tr>
          <tr>
            <td>SQLite Version Number</td>
            <td>{header.sqliteVersionNumber}</td>
          </tr>
        </tbody>
      </table>
    </InfoContent>
  );
}
