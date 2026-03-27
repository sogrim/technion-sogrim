import type { TimetableEvent } from "@/types/timetable";
import { findConflicts } from "@/lib/timetable-conflicts";
import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";

interface ConflictBadgeProps {
  events: TimetableEvent[];
}

export function ConflictBadge({ events }: ConflictBadgeProps) {
  const conflictCount = useMemo(
    () => findConflicts(events).length,
    [events],
  );

  if (conflictCount === 0) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
      <AlertTriangle className="h-3 w-3" />
      <span>{conflictCount} {conflictCount === 1 ? "התנגשות" : "התנגשויות"}</span>
    </div>
  );
}
