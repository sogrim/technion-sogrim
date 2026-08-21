import { useEffect, useMemo, useRef } from "react";
import type { TimetableEvent } from "@/types/timetable";
import { getCourseColorVars } from "@/lib/timetable-colors";
import { eventGroupKey } from "@/lib/timetable-utils";
import { useTimetableStore } from "@/stores/timetable-store";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { Hint } from "@/components/ui/hint";

interface CourseBlockProps {
  event: TimetableEvent;
  compact?: boolean;
  onCustomEventClick?: (eventId: string) => void;
}

export function CourseBlock({ event, compact = false, onCustomEventClick }: CourseBlockProps) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  const setGroup = useTimetableStore((s) => s.setGroup);

  // A group can meet more than once a week, rendering as several blocks.
  // Hovering any of them — or its option button in the panel — highlights the
  // whole set so the pairing is obvious.
  const meetingCount = event.groupLessonCount ?? 1;
  const groupKey = event.isCustom ? null : eventGroupKey(event);
  // Only multi-meeting groups drive the hover from the grid itself; for a lone
  // block its own :hover already says everything.
  const hoverSourceKey = groupKey && meetingCount > 1 ? groupKey : null;
  const setHoveredGroup = useTimetableStore((s) => s.setHoveredGroup);
  const isHighlighted = useTimetableStore(
    (s) => groupKey !== null && s.hoveredGroupKey === groupKey,
  );

  // Blocks can unmount while hovered (clicking a preview swaps it for the
  // chosen block), and then no mouseleave ever fires. Only clear a hover this
  // block itself started — the panel's option buttons own theirs.
  const ownsHoverRef = useRef(false);
  useEffect(() => {
    if (!hoverSourceKey) return;
    return () => {
      if (!ownsHoverRef.current) return;
      const store = useTimetableStore.getState();
      if (store.hoveredGroupKey === hoverSourceKey) store.setHoveredGroup(null);
    };
  }, [hoverSourceKey]);

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

  const blockTitle = [
    event.courseName,
    !event.isCustom && event.kindLabel,
    location,
    event.instructor,
    meetingCount > 1 && `${meetingCount} מפגשים בשבוע`,
    isPreview && "לחצו לבחור",
  ]
    .filter(Boolean)
    .join(" · ");

  const previewBg = isDark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.85)";

  return (
    <Hint label={blockTitle}>
      <div
        onClick={handleClick}
        onMouseEnter={
          hoverSourceKey
            ? () => {
                ownsHoverRef.current = true;
                setHoveredGroup(hoverSourceKey);
              }
            : undefined
        }
        onMouseLeave={
          hoverSourceKey
            ? () => {
                ownsHoverRef.current = false;
                setHoveredGroup(null);
              }
            : undefined
        }
      className={cn(
        "rounded-sm cursor-pointer h-full overflow-hidden",
        "flex flex-col items-start justify-start text-start",
        "transition-all duration-150 p-0.5",
        isPreview
          ? "border hover:border-2"
          : "border hover:brightness-95 dark:hover:brightness-110",
        isHighlighted &&
          (isPreview
            ? "border-2 shadow-md"
            : "brightness-95 dark:brightness-110 shadow-md"),
        event.isCustom && "border-dashed",
        event.hasConflict && "ring-2 ring-destructive ring-offset-1 dark:ring-offset-background",
      )}
      style={{
        ...style,
        fontSize: compact
          ? "min(calc(0.05em + 0.9vh), 12px)"
          : "min(calc(0.1em + 1.1vh), 14px)",
        lineHeight: 1.2,
        backgroundColor: isPreview
          ? (isHighlighted
              ? `color-mix(in srgb, var(--course-bg) 15%, ${previewBg})`
              : previewBg)
          : "var(--course-bg)",
        color: isPreview ? "var(--course-bg)" : "var(--course-text)",
        borderColor: "var(--course-border)",
        // Outline (not ring) so it never fights the conflict ring.
        outline: isHighlighted ? "2px solid var(--course-border)" : undefined,
        outlineOffset: isHighlighted ? "1px" : undefined,
      }}
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
    </Hint>
  );
}
