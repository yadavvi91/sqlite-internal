import { DatabaseBTreePage } from "../../type";
import { useInfoContext } from "../info";
import { BPageHeaderInfo } from "./bpage-header";
import { DatabaseHeaderInfo } from "./database-header";
import { TableLeafCellInfo } from "./table-leaf-cell";

export function InfoSidebar() {
  const { info } = useInfoContext();

  if (info.type === "database-header") {
    return (
      <DatabaseHeaderInfo
        header={info.database.header}
        page={info.database.pages[0]}
      />
    );
  } else if (info.type === "btree-page-header") {
    return <BPageHeaderInfo page={info.page as DatabaseBTreePage} />;
  } else if (info.type === "table-leaf-cell") {
    return <TableLeafCellInfo cell={info.cell} />;
  }

  return <div>Some Unknown</div>;
}
