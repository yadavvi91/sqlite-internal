import { PropsWithChildren, useState } from "react";
import { InfoType } from "../type";
import { InfoSidebar } from "./info/main";
import { InfoContext } from "./info-context";
import { LucideCircleHelp } from "lucide-react";

export function InfoProvider({ children }: PropsWithChildren) {
  const [info, setInfo] = useState<InfoType>({
    type: "started",
  });

  return (
    <InfoContext.Provider value={{ info, setInfo }}>
      <div className="h-screen flex">
        <div className="w-[850px] h-screen overflow-auto bg-gray-100">
          {children}
        </div>
        <div className="border-l border-gray-400 p-4 grow-1 h-screen overflow-y-auto text-sm">
          <InfoSidebar />
        </div>
      </div>
    </InfoContext.Provider>
  );
}

export function InfoContent({ children }: PropsWithChildren) {
  return (
    <div className="font-sans  max-w-[350px] flex flex-col gap-4">
      {children}
    </div>
  );
}

interface InfoHeaderProps {
  pageOffset?: number;
  fileOffset?: number;
  length?: number;
}

export function InfoHeader({
  children,
  fileOffset,
  pageOffset,
  length,
}: PropsWithChildren<InfoHeaderProps>) {
  return (
    <div>
      <h1 className="text-lg font-bold">{children}</h1>
      {length && (
        <div className="text-gray-500 text-sm">
          File Offset: {fileOffset} • Page Offset: {pageOffset} • Length:{" "}
          {length}
        </div>
      )}
    </div>
  );
}

export function InfoTableSizeTooltip() {
  return (
    <div title="Size in bytes" className="flex items-center gap-1">
      <LucideCircleHelp className="w-4 h-4" />
    </div>
  );
}
