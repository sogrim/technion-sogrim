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
  const groupNum = event.groupId.split("-")[0];
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
        "rounded-md cursor-pointer h-full overflow-hidden",
        "flex flex-col items-center justify-center text-center",
        "transition-all duration-150 px-1",
        isPreview
          ? "border-2 hover:border-[3px]"
          : "border-2 hover:brightness-95 dark:hover:brightness-110",
        event.isCustom && "border-dashed",
        event.hasConflict && "ring-2 ring-destructive ring-offset-1 dark:ring-offset-background",
      )}
      style={{
        ...style,
        fontSize: compact ? "calc(0.05em + 1vh)" : "calc(0.1em + 1.3vh)",
        backgroundColor: isPreview
          ? (isDark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.85)")
          : "var(--course-bg)",
        color: isPreview ? "var(--course-bg)" : "var(--course-text)",
        borderColor: "var(--course-border)",
      }}
      title={[
        event.courseName,
        !event.isCustom && `${typeLabel} ${groupNum}`,
        location,
        event.instructor,
        isPreview && "לחצו לבחור",
      ].filter(Boolean).join(" · ")}
    >
      {event.isCustom && !compact && (
        <Star className="absolute top-1 left-1 h-2.5 w-2.5 opacity-60" />
      )}

      {/* Course name */}
      <div className="font-bold leading-tight w-full">
        {event.courseName}
      </div>

      {/* Metadata: type+group, building, instructor */}
      {!event.isCustom && (
        <div className={cn(
          "leading-tight w-full",
          isPreview ? "font-medium" : "opacity-90",
        )} style={{ fontSize: "0.85em" }}>
          <div>{typeLabel} {groupNum}</div>
          {location && <div>{location}</div>}
          {event.instructor && <div>{event.instructor}</div>}
        </div>
      )}
    </div>
  );
}
