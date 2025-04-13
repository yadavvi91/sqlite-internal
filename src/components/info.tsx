import { createContext, PropsWithChildren, useContext, useState } from "react";
import { InfoType } from "../type";
import { InfoSidebar } from "./info/main";

const InfoContext = createContext<{
  info: InfoType;
  setInfo: (info: InfoType) => void;
}>({
  info: { type: "started" },
  setInfo: () => {
    throw new Error("setInfo not implemented");
  },
});

// eslint-disable-next-line react-refresh/only-export-components
export function useInfoContext() {
  return useContext(InfoContext);
}

export function InfoProvider({ children }: PropsWithChildren) {
  const [info, setInfo] = useState<InfoType>({
    type: "started",
  });

  return (
    <InfoContext.Provider value={{ info, setInfo }}>
      <div className="h-screen flex">
        <div className="p-2 w-[850px] h-screen overflow-auto bg-gray-100">
          {children}
        </div>
        <div className="border-l p-4 grow-1 h-screen overflow-y-auto text-sm">
          <InfoSidebar />
        </div>
      </div>
    </InfoContext.Provider>
  );
}
