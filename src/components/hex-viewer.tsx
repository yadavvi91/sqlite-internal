import { useMemo, useState } from "react";
import { Button } from "../button";

interface HexViewProps {
  buffer: ArrayBuffer;
}

export function HexViewer({ buffer }: HexViewProps) {
  const [hexMode, setHexMode] = useState(true);

  const hexContent = useMemo(() => {
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" ");
  }, [buffer]);

  const asciiContent = useMemo(() => {
    const asciiString = Array.from(new Uint8Array(buffer))
      .map((byte) => {
        const char = String.fromCharCode(byte);
        return byte >= 32 && byte <= 126 ? char : ".";
      })
      .join("");

    // Split the string into chunks of 16 characters and join with newline
    const chunkedAscii = asciiString.match(/.{1,28}/g)!.join("\n");
    return <pre>{chunkedAscii}</pre>;
  }, [buffer]);

  return (
    <div>
      <div className="flex gap-2 mb-1">
        <Button selected={hexMode} onClick={() => setHexMode(true)}>
          Hex
        </Button>
        <Button selected={!hexMode} onClick={() => setHexMode(false)}>
          Ascii
        </Button>
      </div>
      <div className="font-mono bg-gray-200 p-2">
        {hexMode ? hexContent : asciiContent}
      </div>
    </div>
  );
}
