import { PropsWithChildren } from "react";

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
  return (
    <tr id={"page" + pageNumber + "-" + offset} className="hover:bg-gray-100">
      <td className="p-1 border">{offset}</td>
      <td className="p-1 border">{length}</td>
      <td className="p-1 border">
        {Array.from(new Uint8Array(hex))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join(" ")}
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
