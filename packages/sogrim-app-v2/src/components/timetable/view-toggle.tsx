import { useTimetableStore } from "@/stores/timetable-store";
import { cn } from "@/lib/utils";
import { CalendarDays, LayoutGrid } from "lucide-react";

export function ViewToggle() {
  const viewMode = useTimetableStore((s) => s.viewMode);
  const setViewMode = useTimetableStore((s) => s.setViewMode);

  return (
    <div className="flex items-center bg-secondary rounded-lg p-0.5 gap-0.5">
      <button
        onClick={() => setViewMode("day")}
        className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
          viewMode === "day"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        <span>יום</span>
      </button>
      <button
        onClick={() => setViewMode("week")}
        className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
          viewMode === "week"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span>שבוע</span>
      </button>
    </div>
  );
}
