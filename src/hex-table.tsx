import { PropsWithChildren, useMemo, useState } from "react";
import { Button } from "./button";

type HexTableRowProps = PropsWithChildren<{
  offset: number;
  length: number;
  hex: ArrayBuffer;
  pageNumber: number;
}>;

export function HexTable({ children }: PropsWithChildren) {
  return (
    <table className="w-full border-collapse border border-gray-300 border-collapse">
      <thead>
        <tr className="bg-gray-200">
          <th className="p-1 border w-[75px]">Offset</th>
          <th className="p-1 border w-[75px]">Legnth</th>
          <th className="p-1 border w-[300px]">Hex</th>
          <th className="p-1 border">Description</th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function HexTableRow({
  pageNumber,
  children,
  offset,
  length,
  hex,
}: HexTableRowProps) {
  const [hexMode, setHexMode] = useState(true);

  const hexContent = useMemo(() => {
    return Array.from(new Uint8Array(hex))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" ")
  }, [hex])

  const asciiContent = useMemo(() => {
    const asciiString = Array.from(new Uint8Array(hex))
      .map((byte) => {
        const char = String.fromCharCode(byte);
        return byte >= 32 && byte <= 126 ? char : '.';
      })
      .join('');

    // Split the string into chunks of 16 characters and join with newline
    const chunkedAscii = asciiString.match(/.{1,28}/g)!.join('\n');
    return <pre>{chunkedAscii}</pre>
  }, [hex]);

  return (
    <tr id={"page" + pageNumber + "-" + offset} className="hover:bg-gray-100">
      <td className="p-1 border">{offset}</td>
      <td className="p-1 border">{length}</td>
      <td className="p-1 border">
        <div className='flex gap-2 mb-1'>
          <Button selected={hexMode} onClick={() => setHexMode(true)}>Hex</Button>
          <Button selected={!hexMode} onClick={() => setHexMode(false)}>Ascii</Button>
        </div>
        <div>
          {hexMode ? hexContent : asciiContent}
        </div>
      </td>
      <td className="p-1 border">{children}</td>
    </tr>
  );
}

export function HexTableGroup({ children }: PropsWithChildren) {
  return (
    <tr>
      <td
        className="text-center p-1 border bg-blue-600 text-white font-bold"
        colSpan={4}
      >
        {children}
      </td>
    </tr>
  );
}
