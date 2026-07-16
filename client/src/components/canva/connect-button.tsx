import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Link2, CheckCircle2 } from "lucide-react";

interface CanvaStatus {
  connected: boolean;
  scope?: string;
}

const STATUS_QUERY_KEY = ["/api/canva/status"];

export default function CanvaConnectButton() {
  const { toast } = useToast();
  const { data: status } = useQuery<CanvaStatus>({ queryKey: STATUS_QUERY_KEY });

  // After the OAuth redirect back from Canva, the app lands here with
  // ?canva=connected or ?canva=error&reason=... in the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const canva = params.get("canva");
    if (!canva) return;

    if (canva === "connected") {
      toast({ title: "Canva connected", description: "You can now import images from Canva." });
    } else if (canva === "error") {
      toast({
        title: "Canva connection failed",
        description: params.get("reason") || "Please try again.",
        variant: "destructive",
      });
    }
    queryClient.invalidateQueries({ queryKey: STATUS_QUERY_KEY });

    params.delete("canva");
    params.delete("reason");
    const query = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (query ? `?${query}` : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/canva/disconnect"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATUS_QUERY_KEY });
      toast({ title: "Canva disconnected" });
    },
  });

  if (status?.connected) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => disconnectMutation.mutate()}
        title="Click to disconnect"
      >
        <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
        Canva Connected
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        window.location.href = "/api/canva/oauth/start";
      }}
    >
      <Link2 className="h-4 w-4 mr-1" />
      Connect Canva
    </Button>
  );
}
