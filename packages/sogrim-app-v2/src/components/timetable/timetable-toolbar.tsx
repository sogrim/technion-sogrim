import { useTimetableStore } from "@/stores/timetable-store";
import { SemesterSelector } from "./semester-selector";
import { DraftTabs } from "./draft-tabs";
import { ViewToggle } from "./view-toggle";
import { ConflictBadge } from "./conflict-badge";
import type { TimetableEvent } from "@/types/timetable";
import { Search, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimetableToolbarProps {
  events: TimetableEvent[];
}

export function TimetableToolbar({ events }: TimetableToolbarProps) {
  const setSearchOpen = useTimetableStore((s) => s.setSearchOpen);
  const drafts = useTimetableStore((s) => s.drafts);
  const activeDraftId = useTimetableStore((s) => s.activeDraftId);
  const publishToPlanner = useTimetableStore((s) => s.publishToPlanner);

  const activeDraft = drafts.find((d) => d.id === activeDraftId);

  return (
    <div className="space-y-3">
      {/* Top row: semester + actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <SemesterSelector />
          <ConflictBadge events={events} />
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle — mobile only */}
          <div className="md:hidden">
            <ViewToggle />
          </div>

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

          {activeDraft && activeDraft.courses.length > 0 && !activeDraft.isPublished && (
            <button
              onClick={() => publishToPlanner(activeDraft.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                "border border-primary text-primary hover:bg-primary/10 transition-colors",
              )}
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">שמור בתכנון</span>
            </button>
          )}

          {activeDraft?.isPublished && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
              נשמר בתכנון
            </div>
          )}
        </div>
      </div>

      {/* Draft tabs row */}
      <DraftTabs />
    </div>
  );
}
