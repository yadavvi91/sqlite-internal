import { DatabaseParsedPage, OverflowPage } from "../type";

export function walkThroughOverflowPage(pages: DatabaseParsedPage[]) {
  return pages.map((page) => {
    if (page.type !== "Unknown") return page;
    return parseOverflowPage(page);
  });
}

function parseOverflowPage(page: DatabaseParsedPage): OverflowPage {
  const { data } = page;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  const nextPage = view.getUint32(0);

  return {
    ...page,
    type: "Overflow",
    nextPage,
  };
}
