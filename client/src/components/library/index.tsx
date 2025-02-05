import { useDrag } from "react-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { GameElementModel } from "@shared/schema";

const GAME_UI_IMAGES = [
  "https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42",
  "https://images.unsplash.com/photo-1594652634010-275456c808d0",
  "https://images.unsplash.com/photo-1540898824226-21f19654dcf1",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420",
];

function DraggableElement({ element }: { element: GameElementModel }) {
  const [{ isDragging }, dragRef] = useDrag({
    type: "game-element",
    item: element,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <Card 
      ref={dragRef}
      className="cursor-move mb-2"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <CardContent className="p-2">
        {element.type === "button" && (
          <button className="w-full py-1 px-2 bg-primary text-primary-foreground">
            {element.properties.text}
          </button>
        )}
        {element.type === "text" && (
          <p>{element.properties.text}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ImageLibrary() {
  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      {GAME_UI_IMAGES.map((url, i) => (
        <Card key={i} className="cursor-move aspect-square">
          <img src={url} alt="UI Element" className="w-full h-full object-cover" />
        </Card>
      ))}
    </div>
  );
}

export default function Library() {
  const { data: elements } = useQuery<GameElementModel[]>({ 
    queryKey: ["/api/elements"],
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Component Library</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <h3 className="text-sm font-medium mb-2">UI Elements</h3>
          {elements?.map(element => (
            <DraggableElement key={element.id} element={element} />
          ))}

          <h3 className="text-sm font-medium mb-2 mt-4">Images</h3>
          <ImageLibrary />
        </div>
      </ScrollArea>
    </div>
  );
}