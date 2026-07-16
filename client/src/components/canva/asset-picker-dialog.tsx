import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Folder, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CanvaFolderItem {
  id: string;
  name: string;
}

interface CanvaImageItem {
  id: string;
  name: string;
  thumbnailUrl: string | null;
}

interface CanvaAssetsResponse {
  folders: CanvaFolderItem[];
  images: CanvaImageItem[];
  continuation: string | null;
}

interface CanvaAssetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (imageUrl: string) => void;
}

export default function CanvaAssetPickerDialog({ open, onOpenChange, onSelect }: CanvaAssetPickerProps) {
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([
    { id: "root", name: "Projects" },
  ]);
  const [importingId, setImportingId] = useState<string | null>(null);
  const { toast } = useToast();

  const currentFolder = folderStack[folderStack.length - 1];

  const { data, isLoading, isError } = useQuery<CanvaAssetsResponse>({
    queryKey: [`/api/canva/assets?folder=${encodeURIComponent(currentFolder.id)}`],
    enabled: open,
  });

  const openFolder = (folder: CanvaFolderItem) => {
    setFolderStack((stack) => [...stack, { id: folder.id, name: folder.name }]);
  };

  const goToBreadcrumb = (index: number) => {
    setFolderStack((stack) => stack.slice(0, index + 1));
  };

  const handleImport = async (image: CanvaImageItem) => {
    setImportingId(image.id);
    try {
      const res = await apiRequest("POST", `/api/canva/assets/${encodeURIComponent(image.id)}/import`, {});
      const imported = await res.json();
      onSelect(imported.url);
      onOpenChange(false);
      toast({ title: "Image imported", description: `${image.name} added from Canva` });
    } catch (error) {
      toast({ title: "Import failed", description: String(error), variant: "destructive" });
    }
    setImportingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import from Canva</DialogTitle>
          <DialogDescription>Pick an image from your Canva projects</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
          {folderStack.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              <button className="hover:underline" onClick={() => goToBreadcrumb(i)}>
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading...
          </div>
        )}

        {isError && (
          <div className="text-sm text-destructive py-6 text-center">
            Couldn't load Canva assets. Make sure Canva is connected.
          </div>
        )}

        {data && (
          <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto py-2">
            {data.folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => openFolder(folder)}
                className="flex flex-col items-center gap-1 p-2 rounded-md border hover:border-primary text-xs"
              >
                <Folder className="h-8 w-8 text-muted-foreground" />
                <span className="truncate w-full text-center">{folder.name}</span>
              </button>
            ))}
            {data.images.map((image) => (
              <button
                key={image.id}
                onClick={() => handleImport(image)}
                disabled={importingId !== null}
                className="flex flex-col items-center gap-1 p-2 rounded-md border hover:border-primary text-xs disabled:opacity-50"
              >
                {image.thumbnailUrl ? (
                  <img src={image.thumbnailUrl} alt={image.name} className="h-16 w-16 object-cover rounded" />
                ) : (
                  <div className="h-16 w-16 bg-muted rounded" />
                )}
                <span className="truncate w-full text-center">
                  {importingId === image.id ? "Importing..." : image.name}
                </span>
              </button>
            ))}
            {data.folders.length === 0 && data.images.length === 0 && (
              <div className="col-span-4 text-center text-sm text-muted-foreground py-8">
                No images found in this folder
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
