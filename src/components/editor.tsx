import { sql, SQLite } from "@codemirror/lang-sql";
import ReactCodeMirror from "@uiw/react-codemirror";
import { LucideCode, LucideX } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface SQLEditorProps {
  onExecute: (query: string) => void;
}

export function SQLEditor({ onExecute }: SQLEditorProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");

  const extensions = useMemo(() => {
    return [
      sql({
        dialect: SQLite,
      }),
    ];
  }, []);

  const onExecuteClicked = useCallback(() => {
    onExecute(code);
  }, [onExecute, code]);

  return (
    <>
      {!open && (
        <div
          onClick={() => {
            setOpen(true);
          }}
          className="hover:bg-gray-200 cursor-pointer flex items-center justify-center w-10 h-10 rounded border shadow fixed right-[10px] bottom-[10px] z-10 bg-white"
        >
          <LucideCode />
        </div>
      )}

      {open && (
        <div className="flex flex-col fixed right-[10px] bottom-[10px] z-10 bg-white w-[620px] h-[200px] border border-black rounded">
          <div className="px-2 py-1 border-b border-black flex gap-2">
            <div className="grow">Query Editor</div>
            <div>
              <LucideX
                className="cursor-pointer"
                onClick={() => setOpen(false)}
              />
            </div>
          </div>
          <div className="grow overflow-hidden">
            <ReactCodeMirror
              value={code}
              onChange={setCode}
              autoFocus
              className="h-full overflow-auto"
              extensions={extensions}
            />
          </div>
          <div className="border-t border-black p-2 flex gap-2 text-xs items-center">
            <div className="grow"></div>
            <button
              onClick={onExecuteClicked}
              className="cursor-pointer border border-black p-1 rounded bg-gray-600 text-white"
            >
              Execute
            </button>
          </div>
        </div>
      )}
    </>
  );
}
