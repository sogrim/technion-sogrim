import { useTimetableStore } from "@/stores/timetable-store";
import { SemesterSelector } from "./semester-selector";
import { DraftTabs } from "./draft-tabs";
import { ViewToggle } from "./view-toggle";
import { ConflictBadge } from "./conflict-badge";
import type { TimetableEvent } from "@/types/timetable";
import { Search, Cloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimetableToolbarProps {
  events: TimetableEvent[];
}

export function TimetableToolbar({ events }: TimetableToolbarProps) {
  const setSearchOpen = useTimetableStore((s) => s.setSearchOpen);
  const syncing = useTimetableStore((s) => s._syncing);
  const lastSaved = useTimetableStore((s) => s._lastSaved);

  return (
    <div className="space-y-3">
      {/* Top row: semester + actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <SemesterSelector />
          <ConflictBadge events={events} />
        </div>

        <div className="flex items-center gap-2">
          {/* Sync indicator */}
          {(syncing || lastSaved > 0) && (
            <div
              className="flex items-center gap-1 text-xs text-muted-foreground"
              title={lastSaved ? `נשמר לאחרונה ${new Date(lastSaved).toLocaleTimeString("he-IL")}` : "שומר..."}
            >
              {syncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : (
                <Cloud className="h-3.5 w-3.5 text-emerald-500" />
              )}
            </div>
          )}

          <ViewToggle />

          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
              "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
            )}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">הוסף קורס</span>
          </button>
        </div>
      </div>

      {/* Draft tabs row */}
      <DraftTabs />
    </div>
  );
}
