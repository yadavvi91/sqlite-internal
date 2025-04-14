import { DatabaseBTreePage } from "../../type";
import { useInfoContext } from "../info-context";
import { BPageHeaderInfo } from "./bpage-header";
import { CellPointerInfo } from "./cell-pointer";
import { DatabaseHeaderInfo } from "./database-header";
import { IndexInteriorCellInfo } from "./index-interior-cell";
import { StartedInfo } from "./starter";
import { TableInteriorCellInfo } from "./table-interior-cell";
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
    return <TableLeafCellInfo cell={info.cell} page={info.page} />;
  } else if (info.type === "table-interior-cell") {
    return <TableInteriorCellInfo cell={info.cell} page={info.page} />;
  } else if (info.type === "btree-cell-pointer") {
    return <CellPointerInfo pointer={info.cellPointer} page={info.page} />;
  } else if (info.type === "index-interior-cell") {
    return <IndexInteriorCellInfo cell={info.cell} page={info.page} />;
  }

  return <StartedInfo />;
}
