import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GameElement } from "@shared/schema";

interface PropertiesProps {
  selectedElement: GameElement | null;
}

export default function Properties({ selectedElement }: PropertiesProps) {
  if (!selectedElement) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Select an element to edit its properties
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Properties</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Position X</Label>
            <Input 
              type="number" 
              value={selectedElement.x}
              onChange={() => {}}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Position Y</Label>
            <Input 
              type="number" 
              value={selectedElement.y}
              onChange={() => {}}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Width</Label>
            <Input 
              type="number" 
              value={selectedElement.width}
              onChange={() => {}}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Height</Label>
            <Input 
              type="number" 
              value={selectedElement.height}
              onChange={() => {}}
            />
          </div>
          
          {selectedElement.type === "text" && (
            <>
              <div className="space-y-2">
                <Label>Text</Label>
                <Input 
                  value={selectedElement.properties.text}
                  onChange={() => {}}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Input 
                  type="number"
                  value={selectedElement.properties.fontSize}
                  onChange={() => {}}
                />
              </div>
            </>
          )}
          
          {selectedElement.type === "button" && (
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input 
                value={selectedElement.properties.text}
                onChange={() => {}}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Color</Label>
            <Input 
              type="color"
              value={selectedElement.properties.color}
              onChange={() => {}}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
