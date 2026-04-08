import { useMemo } from "react";
import type { TimetableEvent } from "@/types/timetable";
import { getCourseColorVars } from "@/lib/timetable-colors";
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
    if (event.isCustom && event.customColor) {
      return {
        "--course-bg": event.customColor,
        "--course-text": "#fff",
        "--course-border": event.customColor,
      } as React.CSSProperties;
    }
    return getCourseColorVars(event.colorIndex, isDark);
  }, [event.colorIndex, event.isCustom, event.customColor, isDark]);

  const location =
    [event.building, event.room].filter(Boolean).join(" ") || undefined;

  const handleClick = () => {
    if (event.isPreview) {
      setGroup(event.courseId, event.type, event.groupId);
    } else if (event.isCustom && event.customEventId && onCustomEventClick) {
      onCustomEventClick(event.customEventId);
    } else if (!event.isCustom) {
      setGroup(event.courseId, event.type, "");
    }
  };

  const isPreview = !!event.isPreview;

  return (
    <div
      onClick={handleClick}
      className={cn(
        "rounded-sm cursor-pointer h-full overflow-hidden",
        "flex flex-col items-start justify-start text-start",
        "transition-all duration-150 p-0.5",
        isPreview
          ? "border hover:border-2"
          : "border hover:brightness-95 dark:hover:brightness-110",
        event.isCustom && "border-dashed",
        event.hasConflict && "ring-2 ring-destructive ring-offset-1 dark:ring-offset-background",
      )}
      style={{
        ...style,
        fontSize: compact ? "calc(0.05em + 0.9vh)" : "calc(0.1em + 1.1vh)",
        lineHeight: 1.2,
        backgroundColor: isPreview
          ? (isDark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.85)")
          : "var(--course-bg)",
        color: isPreview ? "var(--course-bg)" : "var(--course-text)",
        borderColor: "var(--course-border)",
      }}
      title={[
        event.courseName,
        !event.isCustom && event.kindLabel,
        location,
        event.instructor,
        isPreview && "לחצו לבחור",
      ].filter(Boolean).join(" · ")}
    >
      {event.isCustom && !compact && (
        <Star className="absolute top-0.5 left-0.5 h-2 w-2 opacity-60" />
      )}

      {!event.isCustom ? (
        <div className="w-full break-words">
          <div className="font-bold">{event.courseName}</div>
          {location && <div>{location}</div>}
          {event.instructor && <div>{event.instructor}</div>}
          <div>{event.kindLabel}</div>
        </div>
      ) : (
        <div className="font-bold w-full break-words">
          {event.courseName}
        </div>
      )}
    </div>
  );
}
