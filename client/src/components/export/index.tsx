import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileCode, FileJson, FileArchive, Globe } from "lucide-react";
import { GameElement, Scene } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { escapeHtml, escapeAttr } from "@/lib/export-utils";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inkScript: string;
  scenes: Scene[];
  gameName?: string;
}

export default function ExportDialog({ 
  open, 
  onOpenChange, 
  inkScript, 
  scenes,
  gameName = "my-game"
}: ExportDialogProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const { toast } = useToast();

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    setExporting('json');
    try {
      const gameData = {
        name: gameName,
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        inkScript,
        scenes: scenes.map(scene => ({
          id: scene.id,
          name: scene.name,
          elements: scene.elements
        }))
      };
      downloadFile(JSON.stringify(gameData, null, 2), `${gameName}.json`, 'application/json');
      toast({
        title: "Export successful",
        description: "Game exported as JSON file"
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: String(error),
        variant: "destructive"
      });
    }
    setExporting(null);
  };

  const exportAsInk = () => {
    setExporting('ink');
    try {
      downloadFile(inkScript, `${gameName}.ink`, 'text/plain');
      toast({
        title: "Export successful",
        description: "Ink script exported"
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: String(error),
        variant: "destructive"
      });
    }
    setExporting(null);
  };

  const generateStandaloneHTML = () => {
    const elements = scenes.flatMap(scene => scene.elements);
    const safeGameName = escapeHtml(gameName);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeGameName}</title>
  <script src="https://cdn.jsdelivr.net/npm/inkjs@2.2.2/dist/ink.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e; 
      color: #eee;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .game-container {
      width: 100%;
      max-width: 800px;
      min-height: 600px;
      background: #16213e;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      position: relative;
      overflow: hidden;
    }
    .game-canvas {
      position: relative;
      width: 100%;
      height: 400px;
      background: linear-gradient(135deg, #0f3460 0%, #16213e 100%);
    }
    .game-element {
      position: absolute;
      padding: 8px;
      border-radius: 4px;
    }
    .story-area {
      padding: 20px;
      max-height: 200px;
      overflow-y: auto;
      background: rgba(0,0,0,0.3);
    }
    .story-text {
      white-space: pre-wrap;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .story-choice {
      display: block;
      width: 100%;
      padding: 12px 16px;
      margin-bottom: 8px;
      background: #e94560;
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 16px;
      cursor: pointer;
      text-align: left;
      transition: background 0.2s;
    }
    .story-choice:hover {
      background: #ff6b6b;
    }
    .choices-container {
      padding: 20px;
      background: #0f3460;
    }
    .end-message {
      text-align: center;
      padding: 20px;
      color: #888;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="game-container">
    <div class="game-canvas" id="canvas">
      ${elements.map(el => `
        <div class="game-element" 
             id="element-${escapeAttr(el.id)}"
             data-ink-var="${escapeAttr(el.properties.inkVariable || '')}"
             data-onclick="${escapeAttr(el.properties.onClick || '')}"
             style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; color: ${escapeAttr(String(el.properties.color || '#fff'))}; font-size: ${escapeAttr(String(el.properties.fontSize || '14px'))}">
          ${el.type === 'text' ? escapeHtml(el.properties.text || '') : ''}
          ${el.type === 'button' ? `<button style="width:100%;height:100%;background:#e94560;border:none;color:white;border-radius:4px;cursor:pointer">${escapeHtml(el.properties.text || 'Button')}</button>` : ''}
          ${el.type === 'image' ? `<img src="${escapeAttr(el.properties.imageUrl || '')}" style="width:100%;height:100%;object-fit:cover;border-radius:4px" alt="">` : ''}
        </div>
      `).join('')}
    </div>
    <div class="story-area" id="story"></div>
    <div class="choices-container" id="choices"></div>
  </div>

  <script>
    const inkScript = ${JSON.stringify(inkScript)};
    let story;
    const storyEl = document.getElementById('story');
    const choicesEl = document.getElementById('choices');

    function escText(t) {
      const d = document.createElement('div');
      d.textContent = t;
      return d.innerHTML;
    }

    function init() {
      try {
        story = new inkjs.Story(inkScript);
        setupElementBindings();
        continueStory();
      } catch (e) {
        storyEl.textContent = 'Error loading story: ' + e.message;
      }
    }

    function setupElementBindings() {
      document.querySelectorAll('[data-onclick]').forEach(el => {
        const funcName = el.dataset.onclick;
        if (funcName) {
          el.addEventListener('click', () => {
            try {
              story.EvaluateFunction(funcName);
              continueStory();
            } catch (e) {
              console.error('Function call failed:', e);
            }
          });
        }
      });
    }

    function updateVariableBindings() {
      document.querySelectorAll('[data-ink-var]').forEach(el => {
        const varName = el.dataset.inkVar;
        if (varName && story.variablesState[varName] !== undefined) {
          el.textContent = story.variablesState[varName];
        }
      });
    }

    function addStoryParagraph(text, className, style) {
      const p = document.createElement('p');
      p.className = className || 'story-text';
      if (style) p.style.cssText = style;
      p.textContent = text;
      storyEl.appendChild(p);
      storyEl.scrollTop = storyEl.scrollHeight;
    }

    function continueStory() {
      let text = '';
      while (story.canContinue) {
        text += story.Continue();
      }
      
      if (text) {
        addStoryParagraph(text, 'story-text');
      }

      updateVariableBindings();
      
      while (choicesEl.firstChild) choicesEl.removeChild(choicesEl.firstChild);
      if (story.currentChoices.length > 0) {
        story.currentChoices.forEach((choice, i) => {
          const btn = document.createElement('button');
          btn.className = 'story-choice';
          btn.textContent = choice.text;
          btn.onclick = () => makeChoice(i);
          choicesEl.appendChild(btn);
        });
      } else if (!story.canContinue) {
        const endP = document.createElement('p');
        endP.className = 'end-message';
        endP.textContent = 'The End';
        choicesEl.appendChild(endP);
      }
    }

    function makeChoice(index) {
      const choiceText = story.currentChoices[index].text;
      addStoryParagraph('> ' + choiceText, 'story-text', 'color:#e94560');
      story.ChooseChoiceIndex(index);
      continueStory();
    }

    init();
  </script>
</body>
</html>`;
  };

  const exportAsHTML = () => {
    setExporting('html');
    try {
      const html = generateStandaloneHTML();
      downloadFile(html, `${gameName}.html`, 'text/html');
      toast({
        title: "Export successful",
        description: "Standalone HTML game exported"
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: String(error),
        variant: "destructive"
      });
    }
    setExporting(null);
  };

  const exportAsZip = async () => {
    setExporting('zip');
    try {
      const gameData = {
        name: gameName,
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        inkScript,
        scenes
      };

      const readme = `# ${gameName}

An interactive fiction game created with Ink Game Creator.

## Files Included
- game.json - Complete game data (for re-importing)
- story.ink - Ink script source code
- index.html - Standalone playable HTML version

## How to Play
Open index.html in any modern web browser to play the game.

## Editing
Import game.json back into Ink Game Creator to continue editing.

## Created
${new Date().toLocaleDateString()}
`;

      const files: Record<string, string> = {
        'game.json': JSON.stringify(gameData, null, 2),
        'story.ink': inkScript,
        'index.html': generateStandaloneHTML(),
        'README.md': readme
      };

      const response = await fetch('/api/export/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, gameName })
      });

      if (!response.ok) {
        throw new Error('Failed to create ZIP file');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${gameName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Game package exported as ZIP"
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: String(error),
        variant: "destructive"
      });
    }
    setExporting(null);
  };

  const exportOptions = [
    {
      id: 'json',
      title: 'JSON Format',
      description: 'Complete game data for backup or import',
      icon: FileJson,
      action: exportAsJSON
    },
    {
      id: 'ink',
      title: 'Ink Script',
      description: 'Export just the .ink narrative script',
      icon: FileCode,
      action: exportAsInk
    },
    {
      id: 'html',
      title: 'Standalone HTML',
      description: 'Playable game in a single HTML file',
      icon: Globe,
      action: exportAsHTML
    },
    {
      id: 'zip',
      title: 'Complete Package',
      description: 'ZIP with all formats and documentation',
      icon: FileArchive,
      action: exportAsZip
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export Game</DialogTitle>
          <DialogDescription>
            Choose an export format for your game
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {exportOptions.map(option => (
            <Card 
              key={option.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={option.action}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <option.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{option.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardDescription className="text-xs">
                  {option.description}
                </CardDescription>
                {exporting === option.id && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Exporting...
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
