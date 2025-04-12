import { useMemo } from "react";
import { PageList } from "./page-list";
import { parseDatabase } from "./parser/main";
import { InfoProvider } from "./components/info";

interface ViewerProps {
  buffer: ArrayBuffer;
}

export default function Viewer({ buffer }: ViewerProps) {
  const db = useMemo(() => {
    return parseDatabase(buffer);
  }, [buffer]);

  console.log(db);

  return (
    <div>
      <InfoProvider>
        <PageList db={db} />
      </InfoProvider>
    </div>
  );
}
