import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useComputeDegreeStatus } from "@/hooks/use-mutations";

export function ComputeButton() {
  const { mutate, isPending } = useComputeDegreeStatus();

  return (
    <Button
      onClick={() => mutate()}
      disabled={isPending}
      variant="outline"
      size="sm"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {isPending ? "מחשב..." : "חשב סטטוס"}
    </Button>
  );
}
