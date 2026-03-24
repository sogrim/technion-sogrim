import { useMemo } from "react";
import type { TimetableEvent } from "@/types/timetable";
import { getCourseColorVars } from "@/lib/timetable-colors";
import { LESSON_TYPE_NAMES } from "@/lib/timetable-utils";
import { useTimetableStore } from "@/stores/timetable-store";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface CourseBlockProps {
  event: TimetableEvent;
  compact?: boolean;
  onCustomEventClick?: (eventId: string) => void;
}

export function CourseBlock({ event, compact = false, onCustomEventClick }: CourseBlockProps) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const setGroup = useTimetableStore((s) => s.setGroup);
  const setDetailCourse = useTimetableStore((s) => s.setDetailCourse);

  const style = useMemo(() => {
    // Custom events may have a user-picked color
    if (event.isCustom && event.customColor) {
      return {
        "--course-bg": event.customColor,
        "--course-text": "#fff",
        "--course-border": event.customColor,
      } as React.CSSProperties;
    }
    return getCourseColorVars(event.colorIndex, isDark);
  }, [event.colorIndex, event.isCustom, event.customColor, isDark]);

  const typeLabel = LESSON_TYPE_NAMES[event.type];
  const location =
    [event.building, event.room].filter(Boolean).join(" ") || undefined;

  const handleClick = () => {
    if (event.isPreview) {
      setGroup(event.courseId, event.type, event.groupId);
    } else if (event.isCustom && event.customEventId && onCustomEventClick) {
      onCustomEventClick(event.customEventId);
    } else if (!event.isCustom) {
      setDetailCourse(event.courseId);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative rounded-md px-1.5 py-1 overflow-hidden cursor-pointer h-full",
        "border-r-[3px] transition-all duration-150",
        event.isPreview
          ? "opacity-50 border-dashed hover:opacity-80"
          : "hover:brightness-95 dark:hover:brightness-110",
        event.isCustom && "border-dashed",
        event.hasConflict && "ring-2 ring-destructive ring-offset-1 dark:ring-offset-background",
        compact ? "text-[0.6rem] leading-tight" : "text-xs leading-snug",
      )}
      style={{
        ...style,
        backgroundColor: "var(--course-bg)",
        color: "var(--course-text)",
        borderRightColor: "var(--course-border)",
      }}
      title={
        event.isPreview
          ? `לחצו לבחור קבוצה ${event.groupId}`
          : event.isCustom
            ? event.courseName
            : `${event.courseName} - ${typeLabel}${location ? ` | ${location}` : ""}`
      }
    >
      {event.isPreview && (
        <div className={cn(
          "absolute top-0.5 left-0.5 px-1 py-0 rounded text-[0.55rem] font-bold",
          "bg-white/30 dark:bg-black/30",
        )}>
          {event.groupId}
        </div>
      )}
      {event.isCustom && !compact && (
        <Star className="absolute top-1 left-1 h-2.5 w-2.5 opacity-60" />
      )}
      <div className={cn("font-semibold truncate", compact && "text-[0.55rem]")}>
        {event.courseName}
      </div>
      {!event.isCustom && !compact && (
        <>
          <div className="opacity-80 truncate">{typeLabel} {event.groupId}</div>
          {location && (
            <div className="opacity-70 truncate text-[0.65rem]">{location}</div>
          )}
        </>
      )}
      {!event.isCustom && compact && (
        <div className="opacity-80 truncate">{typeLabel} {event.groupId}</div>
      )}
    </div>
  );
}
