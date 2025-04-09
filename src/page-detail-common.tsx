import { HexTableGroup, HexTableRow } from "./hex-table";
import { SqliteTableInteriorPage, SqliteTableLeafPage } from "./type";

export function PageCommonTable({
  page,
}: {
  page: SqliteTableLeafPage | SqliteTableInteriorPage;
}) {
  return (
    <>
      <HexTableGroup>Page Header</HexTableGroup>

      <HexTableRow
        pageNumber={page.pageNumber}
        offset={page.headerOffset}
        length={1}
        hex={page.pageData.subarray(page.headerOffset, page.headerOffset + 1)}
      >
        <strong>Page Type: </strong>
        {page.pageTypeName}
      </HexTableRow>

      <HexTableRow
        pageNumber={page.pageNumber}
        offset={page.headerOffset + 1}
        length={2}
        hex={page.pageData.subarray(
          page.headerOffset + 1,
          page.headerOffset + 3
        )}
      >
        <strong>First Freeblock Offset: </strong>
        {page.header.firstFreeblockOffset}
      </HexTableRow>
      <HexTableRow
        pageNumber={page.pageNumber}
        offset={page.headerOffset + 3}
        length={2}
        hex={page.pageData.subarray(
          page.headerOffset + 3,
          page.headerOffset + 5
        )}
      >
        <strong>Cell Count: </strong>
        {page.header.cellCount}
      </HexTableRow>
      <HexTableRow
        pageNumber={page.pageNumber}
        offset={page.headerOffset + 5}
        length={2}
        hex={page.pageData.subarray(
          page.headerOffset + 5,
          page.headerOffset + 7
        )}
      >
        <strong>First Cell Offset: </strong>
        {page.header.cellPointerArrayOffset}
      </HexTableRow>
      <HexTableRow
        pageNumber={page.pageNumber}
        offset={page.headerOffset + 7}
        length={1}
        hex={page.pageData.subarray(
          page.headerOffset + 7,
          page.headerOffset + 8
        )}
      >
        <strong>Fragmented Free Space: </strong>
        {page.header.fragmentFreeBytes}
      </HexTableRow>

      {page.pageNumber === 0x05 && (
        <HexTableRow
          pageNumber={page.pageNumber}
          offset={page.headerOffset + 8}
          length={4}
          hex={page.pageData.subarray(
            page.headerOffset + 8,
            page.headerOffset + 12
          )}
        >
          <strong>Cell Pointer Array Size: </strong>
          {page.header.cellPointerArrayOffset}
        </HexTableRow>
      )}

      <HexTableGroup>Cell Pointer Array</HexTableGroup>
      {page.cellPointerArray.map((cell, index) => {
        return (
          <HexTableRow
            pageNumber={page.pageNumber}
            key={index}
            offset={cell.offset}
            length={2}
            hex={cell.content}
          >
            <strong>Cell {index}: </strong>
            <a
              href={`#page${page.pageNumber}-${cell.value}`}
              className="text-blue-700 underline"
            >
              {cell.value}
            </a>
          </HexTableRow>
        );
      })}

      {page.unallocatedSpace.length > 0 && (
        <>
          <HexTableGroup>Unallocated Space</HexTableGroup>
          <HexTableRow
            pageNumber={page.pageNumber}
            offset={page.unallocatedSpace.offset}
            length={page.unallocatedSpace.length}
            hex={page.unallocatedSpace.content}
          ></HexTableRow>
        </>
      )}
    </>
  );
}
