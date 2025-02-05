import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function Editor({ value, onChange }: EditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    editorRef.current = monaco.editor.create(containerRef.current, {
      value,
      language: "ink",
      theme: "vs-dark",
      minimap: { enabled: false },
      automaticLayout: true,
    });

    editorRef.current.onDidChangeModelContent(() => {
      onChange(editorRef.current?.getValue() || "");
    });

    return () => {
      editorRef.current?.dispose();
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Ink Script</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div ref={containerRef} className="h-full w-full" />
      </ScrollArea>
    </div>
  );
}
