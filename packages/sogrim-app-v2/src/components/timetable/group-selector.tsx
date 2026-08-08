import type { CourseSchedule, LessonType } from "@/types/timetable";
import { LESSON_TYPE_NAMES, DAY_LABELS } from "@/lib/timetable-utils";
import { useTimetableStore } from "@/stores/timetable-store";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/ui/hint";

interface GroupSelectorProps {
  course: CourseSchedule;
  selectedGroups: Partial<Record<LessonType, string>>;
}

export function GroupSelector({ course, selectedGroups }: GroupSelectorProps) {
  const setGroup = useTimetableStore((s) => s.setGroup);

  // Group the course's groups by type
  const groupsByType = new Map<LessonType, { id: string; summary: string }[]>();
  for (const group of course.groups) {
    if (!groupsByType.has(group.type)) {
      groupsByType.set(group.type, []);
    }
    // Build a short summary: day + time
    const firstLesson = group.lessons[0];
    const dayLabel = firstLesson ? DAY_LABELS[firstLesson.day] : "";
    const timeLabel = firstLesson ? firstLesson.startTime : "";
    const summary = firstLesson ? `${dayLabel} ${timeLabel}` : "";

    groupsByType.get(group.type)!.push({
      id: group.id,
      summary,
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      {Array.from(groupsByType.entries()).map(([type, groups]) => {
        const selectedId = selectedGroups[type];

        return (
          <div key={type} className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[0.65rem] text-muted-foreground w-10 shrink-0">
              {LESSON_TYPE_NAMES[type]}
            </span>
            <div className="flex gap-0.5 flex-wrap">
              {groups.map((g) => (
                <Hint key={g.id} label={g.summary}>
                  <button
                    onClick={() =>
                      setGroup(
                        course.id,
                        type,
                        g.id === selectedId ? "" : g.id,
                      )
                    }
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[0.65rem] font-medium transition-all",
                      g.id === selectedId
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent",
                    )}
                  >
                    {g.id.split("-")[0]}
                  </button>
                </Hint>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
