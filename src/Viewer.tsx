import { useMemo } from "react";
import { PageList } from "./page-list";
import { parseDatabase } from "./parser/main";

interface ViewerProps {
  buffer: ArrayBuffer;
}

export default function Viewer({ buffer }: ViewerProps) {
  const db = useMemo(() => {
    return parseDatabase(buffer);
  }, [buffer]);

  return <PageList db={db} />;
}
