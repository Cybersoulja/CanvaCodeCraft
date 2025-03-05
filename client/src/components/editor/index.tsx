import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Play, Save } from "lucide-react";
import Preview from "@/components/preview";
import "../../../src/lib/ink-language";

const SAMPLE_INK_SCRIPT = `=== start ===
# Basic knot with choices
Hello there! What would you like to do?
* [Go to the garden] -> garden
* [Stay inside] -> stay_inside

=== garden ===
You step into a beautiful garden.
The flowers are blooming.
-> END

=== stay_inside ===
You decide to stay indoors.
It's cozy here.
-> END`;

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

interface InkError {
  message: string;
  line: number;
  column: number;
}

export default function Editor({ value, onChange }: EditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<InkError[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [currentScript, setCurrentScript] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;

    editorRef.current = monaco.editor.create(containerRef.current, {
      value: value || SAMPLE_INK_SCRIPT,
      language: "ink",
      theme: "vs-dark",
      minimap: { enabled: false },
      automaticLayout: true,
      rulers: [80],
      scrollBeyondLastLine: false,
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      wordWrap: "on",
    });

    editorRef.current.onDidChangeModelContent(() => {
      const newValue = editorRef.current?.getValue() || "";
      onChange(newValue);
      validateInkScript(newValue);
    });

    return () => {
      editorRef.current?.dispose();
    };
  }, []);

  const validateInkScript = (script: string) => {
    const newErrors: InkError[] = [];

    // Basic validation rules
    const lines = script.split("\n");
    lines.forEach((line, index) => {
      // Check for unclosed curly braces
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        newErrors.push({
          message: "Mismatched curly braces",
          line: index + 1,
          column: 1,
        });
      }

      // Check for invalid diverts
      const divertMatch = line.match(/->(\s*)([^\s]+)/);
      if (divertMatch && !script.includes(`=== ${divertMatch[2]}`) && divertMatch[2] !== "END") {
        newErrors.push({
          message: `Divert to unknown knot: ${divertMatch[2]}`,
          line: index + 1,
          column: divertMatch.index || 1,
        });
      }
    });

    setErrors(newErrors);

    // Add error markers to the editor
    const markers = newErrors.map((error) => ({
      message: error.message,
      severity: monaco.MarkerSeverity.Error,
      startLineNumber: error.line,
      startColumn: error.column,
      endLineNumber: error.line,
      endColumn: error.column + 1,
    }));

    monaco.editor.setModelMarkers(
      editorRef.current!.getModel()!,
      "ink",
      markers
    );
  };

  const handlePlayClick = () => {
    setCurrentScript(editorRef.current?.getValue() || "");
    setShowPreview(true);
  };

  const handleSaveClick = () => {
    // TODO: Implement saving ink script to the game
    const script = editorRef.current?.getValue() || "";
    // For now, just show a confirmation
    alert("Ink script saved!");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Ink Script</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePlayClick}
            disabled={errors.length > 0}
          >
            <Play className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button variant="default" size="sm" onClick={handleSaveClick}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive" className="mx-4 mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Found {errors.length} error(s) in your ink script
          </AlertDescription>
        </Alert>
      )}

      <ScrollArea className="flex-1">
        <div ref={containerRef} className="h-full w-full" />
      </ScrollArea>

      <Preview 
        open={showPreview} 
        onOpenChange={setShowPreview}
        inkScript={currentScript}
      />
    </div>
  );
}