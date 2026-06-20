import { useEffect, useState, type ComponentType } from "react";
import { Braces, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResourceRecord } from "@/types/bo";
import { Overview } from "./overview";
import { JsonView } from "./json-view";

type ViewMode = "overview" | "json";
const STORAGE_KEY = "bo:detail-view";

function readMode(): ViewMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === "json" ? "json" : "overview";
  } catch {
    return "overview";
  }
}

interface SegButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  children: string;
}

function SegButton({ active, onClick, icon: Icon, children }: SegButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}

/** Detail body with a structured Overview ↔ raw JSON toggle (choice persisted). */
export function ResourceDetail({ record }: { record: ResourceRecord }) {
  const [mode, setMode] = useState<ViewMode>(readMode);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* storage unavailable — ignore */
    }
  }, [mode]);

  return (
    <div className="space-y-4">
      <div
        role="group"
        aria-label="View mode"
        className="inline-flex rounded-lg border bg-muted/40 p-0.5"
      >
        <SegButton active={mode === "overview"} onClick={() => setMode("overview")} icon={LayoutList}>
          Overview
        </SegButton>
        <SegButton active={mode === "json"} onClick={() => setMode("json")} icon={Braces}>
          JSON
        </SegButton>
      </div>

      {mode === "overview" ? <Overview record={record} /> : <JsonView data={record} />}
    </div>
  );
}
