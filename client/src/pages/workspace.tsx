import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Plus, Play, Save, Settings, Download } from "lucide-react";
import Canvas from "@/components/canvas";
import Library from "@/components/library";
import Properties from "@/components/properties";
import Editor from "@/components/editor";
import Preview from "@/components/preview";
import ExportDialog from "@/components/export";
import CanvaConnectButton from "@/components/canva/connect-button";
import { useState, useEffect } from "react";
import { GameElement, Scene, Game } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { extractInkIdentifiers, generateInkBoilerplate } from "@/lib/ink-utils";

export default function Workspace() {
  const [selectedElement, setSelectedElement] = useState<GameElement | null>(null);
  const [inkCode, setInkCode] = useState(generateInkBoilerplate());
  const [scenes, setScenes] = useState<Scene[]>([
    { id: "1", name: "Start Scene", elements: [] }
  ]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [inkVariables, setInkVariables] = useState<string[]>([]);
  const { toast } = useToast();

  // Extract variables and function names from ink code
  useEffect(() => {
    if (!inkCode) return;
    const identifiers = extractInkIdentifiers(inkCode);
    setInkVariables(identifiers);
  }, [inkCode]);

  const { data: games } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const createGameMutation = useMutation({
    mutationFn: async (game: Partial<Game>) => {
      const response = await apiRequest("POST", "/api/games", game);
      return await response.json();
    },
    onSuccess: (data) => {
      setCurrentGame(data);
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Game created",
        description: "Your game has been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save game: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateGameMutation = useMutation({
    mutationFn: async (game: Partial<Game>) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/games/${currentGame?.id}`, 
        game
      );
      return await response.json();
    },
    onSuccess: (data) => {
      setCurrentGame(data);
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Game updated",
        description: "Your changes have been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update game: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleElementUpdate = (updated: GameElement) => {
    // Update the element in the current scene
    const updatedScenes = scenes.map(scene => {
      const index = scene.elements.findIndex(el => el.id === updated.id);
      if (index >= 0) {
        const newElements = [...scene.elements];
        newElements[index] = updated;
        return { ...scene, elements: newElements };
      }
      return scene;
    });

    setScenes(updatedScenes);
    setSelectedElement(updated);
  };

  const handleSaveGame = () => {
    if (currentGame) {
      updateGameMutation.mutate({
        scenes, 
        inkScript: inkCode
      });
    } else {
      createGameMutation.mutate({
        name: "New Game",
        scenes,
        inkScript: inkCode
      });
    }
  };

  const handlePlayGame = () => {
    setShowPreview(true);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col">
        <header className="h-14 border-b flex items-center justify-between px-4 bg-background">
          <h1 className="text-xl font-bold">Ink Game Creator</h1>
          <div className="flex gap-2">
            <CanvaConnectButton />
            <Button variant="outline" size="sm" onClick={handlePlayGame}>
              <Play className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowExport(true)}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="default" size="sm" onClick={handleSaveGame}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
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
                    inkVariables={inkVariables}
                    onElementUpdate={handleElementUpdate}
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

        <Preview 
          open={showPreview} 
          onOpenChange={setShowPreview}
          inkScript={inkCode}
          gameElements={scenes.flatMap(scene => scene.elements)}
        />

        <ExportDialog
          open={showExport}
          onOpenChange={setShowExport}
          inkScript={inkCode}
          scenes={scenes}
          gameName={currentGame?.name || "my-game"}
          gameId={currentGame?.id}
        />
      </div>
    </DndProvider>
  );
}