import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GameElement } from "@shared/schema";
import { useState, useEffect } from "react";
import { ImageDown } from "lucide-react";
import CanvaAssetPickerDialog from "@/components/canva/asset-picker-dialog";

interface PropertiesProps {
  selectedElement: GameElement | null;
  inkVariables?: string[];
  onElementUpdate?: (element: GameElement) => void;
}

export default function Properties({ 
  selectedElement, 
  inkVariables = ["visit_garden", "open_door", "pick_item"], 
  onElementUpdate
}: PropertiesProps) {
  const [element, setElement] = useState<GameElement | null>(null);
  const [showCanvaPicker, setShowCanvaPicker] = useState(false);

  useEffect(() => {
    setElement(selectedElement);
  }, [selectedElement]);

  if (!element) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Select an element to edit its properties
      </div>
    );
  }

  const handleChange = (key: string, value: any) => {
    const updated = { ...element };

    if (key.includes('.')) {
      // Handle nested properties
      const [parent, child] = key.split('.');
      updated.properties = {
        ...updated.properties,
        [child]: value
      };
    } else {
      // Handle top-level properties
      (updated as any)[key] = value;
    }

    setElement(updated);
    if (onElementUpdate) {
      onElementUpdate(updated);
    }
  };

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
              value={element.x}
              onChange={(e) => handleChange('x', parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Position Y</Label>
            <Input 
              type="number" 
              value={element.y}
              onChange={(e) => handleChange('y', parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Width</Label>
            <Input 
              type="number" 
              value={element.width}
              onChange={(e) => handleChange('width', parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Height</Label>
            <Input 
              type="number" 
              value={element.height}
              onChange={(e) => handleChange('height', parseInt(e.target.value))}
            />
          </div>

          {element.type === "text" && (
            <>
              <div className="space-y-2">
                <Label>Text</Label>
                <Textarea 
                  value={element.properties.text || ""}
                  onChange={(e) => handleChange('properties.text', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Font Size</Label>
                <Input 
                  type="number"
                  value={element.properties.fontSize || 16}
                  onChange={(e) => handleChange('properties.fontSize', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Ink Variable Binding (Dynamic Text)</Label>
                <Select 
                  value={element.properties.inkVariable || ""} 
                  onValueChange={(value) => handleChange('properties.inkVariable', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select variable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {inkVariables.map(variable => (
                      <SelectItem key={variable} value={variable}>
                        {variable}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Content will update based on the ink variable value
                </p>
              </div>
            </>
          )}

          {element.type === "button" && (
            <>
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input 
                  value={element.properties.text || ""}
                  onChange={(e) => handleChange('properties.text', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Action on Click</Label>
                <Select 
                  value={element.properties.onClick || ""} 
                  onValueChange={(value) => handleChange('properties.onClick', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {inkVariables.map(variable => (
                      <SelectItem key={variable} value={variable}>
                        {variable}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  This will trigger the selected ink function when clicked
                </p>
              </div>
            </>
          )}

          {element.type === "image" && (
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={element.properties.imageUrl || ""}
                onChange={(e) => handleChange('properties.imageUrl', e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowCanvaPicker(true)}
              >
                <ImageDown className="h-4 w-4 mr-1" />
                Import from Canva
              </Button>
              <CanvaAssetPickerDialog
                open={showCanvaPicker}
                onOpenChange={setShowCanvaPicker}
                onSelect={(imageUrl) => handleChange('properties.imageUrl', imageUrl)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              <Input 
                type="color"
                value={element.properties.color || "#000000"}
                onChange={(e) => handleChange('properties.color', e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input 
                type="text"
                value={element.properties.color || "#000000"}
                onChange={(e) => handleChange('properties.color', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}