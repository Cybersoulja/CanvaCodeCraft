import { useDrop } from "react-dnd";
import { GameElement, Scene } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { addElementToScene } from "@/lib/scene-utils";

interface CanvasProps {
  scenes: Scene[];
  currentSceneId: string;
  onSceneChange: (sceneId: string) => void;
  onScenesChange: (scenes: Scene[]) => void;
  onSelectElement: (element: GameElement | null) => void;
}

export default function Canvas({
  scenes,
  currentSceneId,
  onSceneChange,
  onScenesChange,
  onSelectElement,
}: CanvasProps) {
  const elements = scenes.find((scene) => scene.id === currentSceneId)?.elements ?? [];

  const addScene = () => {
    const newScene: Scene = {
      id: crypto.randomUUID(),
      name: `Scene ${scenes.length + 1}`,
      elements: [],
    };
    onScenesChange([...scenes, newScene]);
  };

  const [{ isOver }, dropRef] = useDrop({
    accept: "game-element",
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset) return;

      const element: GameElement = {
        id: crypto.randomUUID(),
        type: item.type,
        x: offset.x,
        y: offset.y,
        width: 100,
        height: 100,
        properties: item.properties,
      };

      onScenesChange(addElementToScene(scenes, currentSceneId, element));
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-2 border-b">
        <select
          value={currentSceneId}
          onChange={(e) => onSceneChange(e.target.value)}
          className="p-1 rounded border"
        >
          {scenes.map(scene => (
            <option key={scene.id} value={scene.id}>
              {scene.name}
            </option>
          ))}
        </select>
        <button
          onClick={addScene}
          className="px-2 py-1 bg-primary text-primary-foreground rounded"
        >
          Add Scene
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden" ref={dropRef}>
        <div
          className={cn(
            "w-full h-full bg-background",
            isOver && "bg-accent/20"
          )}
        >
          {elements.map(element => (
            <Card
              key={element.id}
              className="absolute cursor-move"
              style={{
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
              }}
              onClick={() => onSelectElement(element)}
            >
              {element.type === "text" && (
                <p style={{
                  fontSize: element.properties.fontSize,
                  color: element.properties.color,
                  padding: "8px"
                }}>
                  {element.properties.text}
                </p>
              )}
              {element.type === "button" && (
                <button
                  className="w-full h-full"
                  style={{ color: element.properties.color }}
                >
                  {element.properties.text}
                </button>
              )}
              {element.type === "image" && (
                <img
                  src={element.properties.imageUrl}
                  alt="Game element"
                  className="w-full h-full object-cover"
                />
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
