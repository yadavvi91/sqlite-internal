import { LucideChevronLeft } from "lucide-react";
import { DatabaseParsedPage } from "../type";
import { PropsWithChildren } from "react";
import { useInfoContext } from "./info-context";

export function PageHeader({ page }: { page: DatabaseParsedPage }) {
  const { setInfo } = useInfoContext();

  return (
    <div className="sticky top-0 bg-white z-10 p-2 border-b mb-2">
      <div className="font-bold flex gap-2 items-center">
        <a
          href="#"
          onClick={() => {
            setInfo({ type: "started" });
          }}
        >
          <LucideChevronLeft className="inline-block" />
        </a>
        Page {page.number} | {page.type}
      </div>
    </div>
  );
}

export function PageCanvasContainer({ children }: PropsWithChildren) {
  return (
    <div className="m-2 p-2 bg-white border border-black rounded inline-block">
      {children}
    </div>
  );
}
