import { LucideFile } from "lucide-react";
import { useState } from "react";

interface LoadSampleDatabaseProps {
  onFileLoad: (buffer: ArrayBuffer) => void;
  text: string;
  file: string;
}

const LoadSampleDatabase = ({
  file,
  text,
  onFileLoad,
}: LoadSampleDatabaseProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadSample = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(file);
      const buffer = await response.arrayBuffer();
      onFileLoad(buffer);
    } catch (error) {
      console.error("Failed to load sample database:", error);
      alert("Failed to load sample database");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLoadSample}
      disabled={isLoading}
      className={`flex flex-col items-center px-5 py-2.5 mt-5 rounded bg-white border border-black grow w-full flex gap-2 ${
        isLoading ? "cursor-default opacity-70" : "cursor-pointer opacity-100"
      } transition-opacity`}
    >
      <LucideFile />

      {isLoading ? (
        <span>
          {text}...
          <span className="loading-dots ml-1.5">
            <span className="inline-block animate-blink">.</span>
            <span className="inline-block animate-blink animation-delay-200">
              .
            </span>
            <span className="inline-block animate-blink animation-delay-400">
              .
            </span>
          </span>
        </span>
      ) : (
        text
      )}
    </button>
  );
};

export default LoadSampleDatabase;
