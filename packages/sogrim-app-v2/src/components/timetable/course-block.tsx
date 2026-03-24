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
      // Ghost block → select this group
      setGroup(event.courseId, event.type, event.groupId);
    } else if (event.isCustom && event.customEventId && onCustomEventClick) {
      onCustomEventClick(event.customEventId);
    } else if (!event.isCustom) {
      // Solid block → unschedule (deselect this group, back to ghost state)
      setGroup(event.courseId, event.type, "");
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative rounded-md px-1.5 py-1 overflow-hidden cursor-pointer h-full",
        "transition-all duration-150",
        event.isPreview
          ? "opacity-40 border-2 border-dashed hover:opacity-70"
          : "border-r-[3px] hover:brightness-95 dark:hover:brightness-110",
        event.isCustom && "border-dashed",
        event.hasConflict && "ring-2 ring-destructive ring-offset-1 dark:ring-offset-background",
        compact ? "text-[0.6rem] leading-tight" : "text-xs leading-snug",
      )}
      style={{
        ...style,
        backgroundColor: event.isPreview ? "transparent" : "var(--course-bg)",
        color: "var(--course-text)",
        borderColor: event.isPreview ? "var(--course-bg)" : undefined,
        borderRightColor: event.isPreview ? undefined : "var(--course-border)",
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
          {event.groupId.split("-")[0]}
        </div>
      )}
      {event.isCustom && !compact && (
        <Star className="absolute top-1 left-1 h-2.5 w-2.5 opacity-60" />
      )}
      <div className={cn("font-semibold", compact && "text-[0.55rem]")}>
        {event.courseName}
      </div>
      {!event.isCustom && (
        <div className={cn(
          "opacity-80 leading-snug",
          compact ? "text-[0.5rem]" : "text-[0.6rem] mt-0.5",
        )}>
          <div>{typeLabel} {event.groupId.split("-")[0]}</div>
          {location && <div>{location}</div>}
          {!compact && event.instructor && <div className="opacity-85">{event.instructor}</div>}
        </div>
      )}
    </div>
  );
}
