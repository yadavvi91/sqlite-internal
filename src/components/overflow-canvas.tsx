import { Database, OverflowPage } from "../type";
import { CANVAS_GRID_X_SIZE } from "./consts";
import { PageCanvas, PageCanvasSegment } from "./page-canvas";
import { PageCanvasContainer, PageHeader } from "./page-header";

export function OverflowCanvas({
  page,
  db,
}: {
  page: OverflowPage;
  db: Database;
}) {
  return (
    <>
      <PageHeader page={page} />
      <PageCanvasContainer>
        <PageCanvas size={db.header.pageSize} x={CANVAS_GRID_X_SIZE}>
          <PageCanvasSegment
            length={4}
            offset={0}
            label="Next Page"
            info={{ type: "overflow-next-page", page }}
          />
          {page.payload && (
            <PageCanvasSegment
              offset={page.payload.offset}
              length={page.payload.length}
              colorClassName="bg-red-300"
              label="Payload"
              info={{ type: "overflow-payload", page }}
            />
          )}
        </PageCanvas>
      </PageCanvasContainer>
    </>
  );
}
