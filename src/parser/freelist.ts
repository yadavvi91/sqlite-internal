import {
  DatabaseHeader,
  DatabaseParsedPage,
  DatabaseUnparsedPage,
  FreeTrunkCell,
  FreeTrunkPage,
} from "../type";

export function walkThroughFreeList(
  pages: DatabaseUnparsedPage[],
  header: DatabaseHeader
): DatabaseParsedPage[] {
  // Mark all the page as unknown
  const result: DatabaseParsedPage[] = pages.map((page) => ({
    ...page,
    type: "Unknown",
  }));

  // Walk through all the free list trunk page
  const trunkPageList: FreeTrunkPage[] = [];
  let currentTrunkPageNumber = header.firstFreelistPage;

  while (currentTrunkPageNumber) {
    const trunkPage = parseFreeListTrunk(result[currentTrunkPageNumber - 1]);
    result[currentTrunkPageNumber - 1] = trunkPage;
    trunkPageList.push(trunkPage);
    currentTrunkPageNumber = trunkPage.nextTrunkPage;
  }

  // Mark all the free page
  for (const trunkPage of trunkPageList) {
    for (const freePageNumber of trunkPage.freePageNumbers) {
      result[freePageNumber.pageNumber - 1] = {
        ...result[freePageNumber.pageNumber - 1],
        type: "Free Leaf",
      };
    }
  }

  return result;
}

function parseFreeListTrunk(page: DatabaseParsedPage): FreeTrunkPage {
  const { data } = page;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  let cursor = 0;

  const nextTrunkPage = view.getUint32(cursor);
  cursor += 4;

  const count = view.getUint32(cursor);
  cursor += 4;

  const freePageNumbers: FreeTrunkCell[] = new Array(count);
  for (let i = 0; i < count; i++) {
    freePageNumbers[i] = {
      length: 4,
      offset: cursor,
      pageNumber: view.getUint32(cursor),
    };
    cursor += 4;
  }

  return {
    ...page,
    freePageNumbers,
    nextTrunkPage,
    count,
    type: "Free Trunk",
  };
}
