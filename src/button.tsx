import { PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<{
  selected?: boolean;
  onClick?: () => void;
}>

export function Button({ children, onClick, selected }: ButtonProps) {
  const className = [selected ? 'bg-gray-700 text-white' : '', 'px-2 py-0.5 bg-gray-200 rounded text-sm hover:bg-gray-300 cursor-pointer'].filter(Boolean).join(" ");
  return <button onClick={onClick} className={className}>{children}</button>
}