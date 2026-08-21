import { useEffect, useRef } from "react";
import type { CourseSchedule, LessonType } from "@/types/timetable";
import { LESSON_TYPE_NAMES, eventGroupKey } from "@/lib/timetable-utils";
import { useTimetableStore } from "@/stores/timetable-store";
import { cn } from "@/lib/utils";

interface GroupSelectorProps {
  course: CourseSchedule;
  selectedGroups: Partial<Record<LessonType, string>>;
}

export function GroupSelector({ course, selectedGroups }: GroupSelectorProps) {
  const setGroup = useTimetableStore((s) => s.setGroup);
  const setHoveredGroup = useTimetableStore((s) => s.setHoveredGroup);

  // Buttons unmount mid-hover when the card is collapsed or the course is
  // removed, and then no mouseleave ever fires.
  const ownedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      const owned = ownedKeyRef.current;
      if (!owned) return;
      const store = useTimetableStore.getState();
      if (store.hoveredGroupKey === owned) store.setHoveredGroup(null);
    };
  }, []);

  // Group the course's groups by type
  const groupsByType = new Map<LessonType, string[]>();
  for (const group of course.groups) {
    if (!groupsByType.has(group.type)) {
      groupsByType.set(group.type, []);
    }
    groupsByType.get(group.type)!.push(group.id);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {Array.from(groupsByType.entries()).map(([type, groupIds]) => {
        const selectedId = selectedGroups[type];

        return (
          <div key={type} className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[0.65rem] text-muted-foreground w-10 shrink-0">
              {LESSON_TYPE_NAMES[type]}
            </span>
            <div className="flex gap-0.5 flex-wrap">
              {groupIds.map((groupId) => (
                <button
                  key={groupId}
                  onClick={() =>
                    setGroup(
                      course.id,
                      type,
                      groupId === selectedId ? "" : groupId,
                    )
                  }
                  onMouseEnter={() => {
                    const key = eventGroupKey({
                      courseId: course.id,
                      type,
                      groupId,
                    });
                    ownedKeyRef.current = key;
                    setHoveredGroup(key);
                  }}
                  onMouseLeave={() => {
                    ownedKeyRef.current = null;
                    setHoveredGroup(null);
                  }}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[0.65rem] font-medium transition-all",
                    groupId === selectedId
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent",
                  )}
                >
                  {groupId.split("-")[0]}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
