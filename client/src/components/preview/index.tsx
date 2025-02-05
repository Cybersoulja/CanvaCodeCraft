import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function Preview({ open, onOpenChange }: PreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] w-[90vw]">
        <DialogHeader>
          <DialogTitle>Game Preview</DialogTitle>
        </DialogHeader>
        
        <div className="aspect-video bg-accent rounded-lg">
          {/* Preview content */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
