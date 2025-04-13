import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { cn } from "./utils";
import { InfoType } from "../type";
import { useInfoContext } from "./info";

interface PageCanvasProps {
  x: number;
  size: number;
}

const CELL_SIZE = 22;

const PageCanvasContext = createContext<PageCanvasProps>({ x: 0, size: 0 });

export function PageCanvas({
  children,
  ...props
}: PropsWithChildren<PageCanvasProps>) {
  return (
    <div
      className="relative bg-[radial-gradient(#aaa_1px,transparent_1px)] [background-size:22px_22px]"
      style={{
        width: props.x * CELL_SIZE + "px",
        height: Math.ceil(props.size / props.x) * CELL_SIZE + "px",
      }}
    >
      <PageCanvasContext.Provider value={props}>
        {children}
      </PageCanvasContext.Provider>
    </div>
  );
}

interface PageCanvasSegment {
  offset: number;
  length: number;
  colorClassName?: string;
  label?: string;
  info?: InfoType;
}

export function PageCanvasSegment({
  offset,
  length,
  colorClassName,
  label,
  info,
}: PageCanvasSegment) {
  const { info: currentInfo, setInfo } = useInfoContext();
  const { x } = useContext(PageCanvasContext);

  const selected = useMemo(() => {
    if (!info) return false;
    if (info.type !== currentInfo.type) return false;

    if (info.type === "database-header") return true;

    if (
      info.type === "btree-page-header" &&
      currentInfo.type === "btree-page-header" &&
      currentInfo.page.number === info.page.number
    )
      return true;

    if (
      info.type === "table-leaf-cell" &&
      currentInfo.type === "table-leaf-cell" &&
      currentInfo.cell === info.cell
    )
      return true;

    return false;
  }, [info, currentInfo]);

  // Break it into chunk
  const chunks = useMemo(() => {
    const chunks: { offset: number; length: number }[] = [];
    let currentOffset = offset % x;
    let remainingLength = length;

    while (remainingLength > 0) {
      if (x < currentOffset + remainingLength) {
        const chunkLength = x - currentOffset;
        chunks.push({ offset: currentOffset, length: chunkLength });
        remainingLength -= chunkLength;
        currentOffset = 0;
      } else {
        chunks.push({ offset: currentOffset, length: remainingLength });
        break;
      }
    }

    return chunks;
  }, [x, length, offset]);

  const line = Math.floor(offset / x);

  return (
    <>
      {chunks.map((chunk, idx) => (
        <div
          title={`Offset: ${offset}\nLength: ${length}`}
          key={idx}
          onClick={info ? () => setInfo(info) : undefined}
          className={cn(
            "absolute bg-gray-300 border-gray-500 border-t border-b cursor-pointer text-xs line-clamp-1 overflow-hidden",
            {
              "border-l": idx === 0,
              "border-r": idx === chunks.length - 1,
              "diag-pattern": selected,
            },
            colorClassName
          )}
          style={{
            top: 1 + (line + idx) * CELL_SIZE,
            left: chunk.offset * CELL_SIZE + 1,
            width: chunk.length * CELL_SIZE - 2,
            height: CELL_SIZE - 2,
          }}
        >
          {idx === 0 && !!label && (
            <span className="line-clamp-1 overflow-hidden mx-1">{label}</span>
          )}
        </div>
      ))}
    </>
  );
}
