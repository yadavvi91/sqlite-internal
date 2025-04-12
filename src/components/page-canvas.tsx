import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { cn } from "./utils";

interface PageCanvasProps {
  x: number;
  size: number;
}

const CELL_SIZE = 20;

const PageCanvasContext = createContext<PageCanvasProps>({ x: 0, size: 0 });

export function PageCanvas({
  children,
  ...props
}: PropsWithChildren<PageCanvasProps>) {
  return (
    <div
      className="relative"
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
}

export function PageCanvasSegment({
  offset,
  length,
  colorClassName,
  label,
}: PageCanvasSegment) {
  const { x } = useContext(PageCanvasContext);

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
          key={chunk.offset}
          className={cn(
            "absolute bg-gray-300 border-gray-500 border-t border-b cursor-pointer text-xs line-clamp-1 overflow-hidden",
            {
              "border-l": idx === 0,
              "border-r": idx === chunks.length - 1,
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
