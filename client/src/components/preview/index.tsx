import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Story } from "inkjs/engine/Story";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { GameElement } from "@shared/schema";

interface PreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inkScript: string;
  gameElements?: GameElement[];
}

export default function Preview({ open, onOpenChange, inkScript, gameElements = [] }: PreviewProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [currentText, setCurrentText] = useState<string>("");
  const [choices, setChoices] = useState<string[]>([]);
  const [storyHistory, setStoryHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [storyVariables, setStoryVariables] = useState<Record<string, any>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && inkScript) {
      try {
        // Reset state
        setError(null);
        setStoryHistory([]);
        setChoices([]);
        setCurrentText("");
        setStoryVariables({});

        // Create a new story instance
        const inkStory = new Story(inkScript);

        // Setup external function bindings if needed
        setupExternalFunctions(inkStory);

        setStory(inkStory);

        // Initial content
        continueStory(inkStory);
      } catch (e) {
        console.error("Error initializing ink story:", e);
        setError(`Failed to compile ink script: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }, [open, inkScript]);

  useEffect(() => {
    // Scroll to bottom when content updates
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [storyHistory, currentText, choices]);

  // Setup external functions that can be called from ink script
  const setupExternalFunctions = (inkStory: Story) => {
    // For each game element that has an onClick handler, register it as an external function
    gameElements?.forEach(element => {
      if (element.properties.onClick) {
        inkStory.BindExternalFunction(
          element.properties.onClick,
          () => {
            console.log(`Triggered function: ${element.properties.onClick}`);
            return true;
          }
        );
      }
    });
  };

  // Update the variables in state after each story continuation
  const updateVariables = (inkStory: Story) => {
    const variables: Record<string, any> = {};
    const tags = inkStory.currentTags;

    // Extract any variables from the story state using public API methods
    // Instead of accessing _globalVariables directly, use the public API
    // This is a workaround since inkjs doesn't expose a direct method to get all variables
    const commonVarNames = [
      'player_name', 'health', 'inventory', 'score', 'money',
      'visited_garden', 'visited_town', 'has_key', 'has_sword',
      'current_scene', 'current_location'
    ];

    // Try to get values for common variables and any that we know exist from ink script
    [...commonVarNames, ...Object.keys(storyVariables)].forEach(varName => {
      try {
        if (inkStory.variablesState[varName] !== undefined) {
          variables[varName] = inkStory.variablesState[varName];
        }
      } catch (e) {
        // Variable doesn't exist, skip it
      }
    });

    // Extract any tags (useful for scene changes, etc)
    if (tags && tags.length > 0) {
      tags.forEach(tag => {
        // Parse tags in format like "variable: value"
        const parts = tag.split(':');
        if (parts.length === 2) {
          const key = parts[0].trim();
          const value = parts[1].trim();
          variables[key] = value;
        }
      });
    }

    setStoryVariables(variables);
  };

  const continueStory = (inkStory: Story) => {
    // Get story content until we reach a choice or the end
    let text = "";
    while (inkStory.canContinue) {
      text += inkStory.Continue() + "\n";

      // Check for any tags after continuing
      if (inkStory.currentTags && inkStory.currentTags.length > 0) {
        updateVariables(inkStory);
      }
    }

    // Set the current content
    if (text) {
      setCurrentText(text);
      setStoryHistory(prev => [...prev, text]);
    }

    // Update variables after continuing the story
    updateVariables(inkStory);

    // Get choices if available
    if (inkStory.currentChoices.length > 0) {
      setChoices(inkStory.currentChoices.map(choice => choice.text));
    } else if (!inkStory.canContinue) {
      // End of story
      setChoices([]);
    }
  };

  const handleChoiceClick = (index: number) => {
    if (!story) return;

    // Choose this option
    story.ChooseChoiceIndex(index);

    // Add the choice to history
    const choiceText = choices[index];
    setStoryHistory(prev => [...prev, `> ${choiceText}`]);

    // Clear current state and continue
    setCurrentText("");
    setChoices([]);
    continueStory(story);
  };

  // Handle a game element action
  const handleElementAction = (functionName: string) => {
    if (!story) return;

    try {
      // Call the external function in the ink story
      const result = story.EvaluateFunction(functionName);
      console.log(`Function ${functionName} result:`, result);

      // Continue the story after the function call if needed
      continueStory(story);
    } catch (e) {
      console.error(`Error calling function ${functionName}:`, e);
    }
  };

  // Render a game element with dynamic content from story variables
  const renderGameElement = (element: GameElement) => {
    // Check if this element should show dynamic content from an ink variable
    let content = element.properties.text || "";
    if (element.properties.inkVariable && storyVariables[element.properties.inkVariable] !== undefined) {
      content = String(storyVariables[element.properties.inkVariable]);
    }

    return (
      <Card
        key={element.id}
        className="absolute"
        style={{
          left: element.x, 
          top: element.y,
          width: element.width,
          height: element.height
        }}
        onClick={() => element.properties.onClick && handleElementAction(element.properties.onClick)}
      >
        {element.type === "text" && (
          <p style={{
            fontSize: element.properties.fontSize,
            color: element.properties.color,
            padding: "8px"
          }}>
            {content}
          </p>
        )}
        {element.type === "button" && (
          <button
            className="w-full h-full"
            style={{ color: element.properties.color }}
          >
            {content}
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
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] w-[90vw] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Game Preview</DialogTitle>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-col h-[500px]">
            <div className="flex-1 relative overflow-hidden">
              <div className="relative w-full h-full bg-muted rounded-lg">
                {/* Display game elements */}
                {gameElements.map(element => renderGameElement(element))}

                {/* Story text area */}
                <ScrollArea className="absolute bottom-0 left-0 right-0 h-1/3 bg-background/80 backdrop-blur-sm p-4" ref={scrollRef}>
                  <div className="space-y-2">
                    {storyHistory.map((text, i) => (
                      <div 
                        key={i} 
                        className={`whitespace-pre-wrap ${text.startsWith(">") ? "font-bold" : ""}`}
                      >
                        {text}
                      </div>
                    ))}
                    {currentText && (
                      <div className="whitespace-pre-wrap">{currentText}</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {choices.length > 0 && (
              <div className="mt-4 space-y-2">
                {choices.map((choice, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    className="w-full justify-start text-left" 
                    onClick={() => handleChoiceClick(i)}
                  >
                    {choice}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}