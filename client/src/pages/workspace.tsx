import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Canvas from "@/components/canvas";
import Library from "@/components/library";
import Properties from "@/components/properties";
import Editor from "@/components/editor";
import { useState } from "react";
import { GameElement } from "@shared/schema";

export default function Workspace() {
  const [selectedElement, setSelectedElement] = useState<GameElement | null>(null);
  const [inkCode, setInkCode] = useState("");

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col">
        <header className="h-14 border-b flex items-center px-4 bg-background">
          <h1 className="text-xl font-bold">Game Creator</h1>
        </header>
        
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Left sidebar */}
            <ResizablePanel defaultSize={20} minSize={15}>
              <Library />
            </ResizablePanel>
            
            <ResizableHandle />
            
            {/* Main canvas area */}
            <ResizablePanel defaultSize={55}>
              <Canvas 
                onSelectElement={setSelectedElement}
              />
            </ResizablePanel>
            
            <ResizableHandle />
            
            {/* Right sidebar */}
            <ResizablePanel defaultSize={25}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={50}>
                  <Properties 
                    selectedElement={selectedElement}
                  />
                </ResizablePanel>
                
                <ResizableHandle />
                
                <ResizablePanel defaultSize={50}>
                  <Editor
                    value={inkCode}
                    onChange={setInkCode}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </DndProvider>
  );
}
