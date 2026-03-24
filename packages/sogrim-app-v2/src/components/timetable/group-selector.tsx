import type { CourseSchedule, LessonType } from "@/types/timetable";
import { LESSON_TYPE_NAMES, DAY_LABELS } from "@/lib/timetable-utils";
import { useTimetableStore } from "@/stores/timetable-store";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

interface GroupSelectorProps {
  course: CourseSchedule;
  selectedGroups: Partial<Record<LessonType, string>>;
}

export function GroupSelector({ course, selectedGroups }: GroupSelectorProps) {
  const setGroup = useTimetableStore((s) => s.setGroup);
  const previewingCourse = useTimetableStore((s) => s.previewingCourse);
  const previewingType = useTimetableStore((s) => s.previewingType);
  const setPreview = useTimetableStore((s) => s.setPreview);

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

  const isPreviewing = previewingCourse === course.id;

  return (
    <div className="flex flex-col gap-1.5">
      {Array.from(groupsByType.entries()).map(([type, groups]) => {
        if (groups.length <= 1) return null;
        const selectedId = selectedGroups[type];
        const isTypePreview = isPreviewing && previewingType === type;

        return (
          <div key={type} className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[0.65rem] text-muted-foreground w-10 shrink-0">
              {LESSON_TYPE_NAMES[type]}
            </span>
            <div className="flex gap-0.5 flex-wrap">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGroup(course.id, type, g.id)}
                  title={g.summary}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[0.65rem] font-medium transition-all",
                    g.id === selectedId
                      ? "bg-primary text-primary-foreground"
                      : isTypePreview
                        ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                        : "bg-secondary text-secondary-foreground hover:bg-accent",
                  )}
                >
                  {g.id.split("-")[0]}
                </button>
              ))}
            </div>
            {/* Preview all button */}
            <button
              onClick={() => {
                if (isTypePreview) {
                  setPreview(null, null);
                } else {
                  setPreview(course.id, type);
                }
              }}
              title="הצג את כל האפשרויות על המערכת"
              className={cn(
                "p-0.5 rounded transition-colors",
                isTypePreview
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary",
              )}
            >
              <Eye className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
