import { createContext, useContext } from "react";
import { InfoType } from "../type";

export const InfoContext = createContext<{
  info: InfoType;
  setInfo: (info: InfoType) => void;
}>({
  info: { type: "started" },
  setInfo: () => {
    throw new Error("setInfo not implemented");
  },
});

export function useInfoContext() {
  return useContext(InfoContext);
}
