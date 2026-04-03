import { useMemo, useState, useCallback, useRef } from "react";
import type { Day, TimetableEvent } from "@/types/timetable";
import {
  DAY_NAMES,
  WEEKDAYS,
  DEFAULT_START_HOUR,
  DEFAULT_END_HOUR,
  SLOT_MINUTES,
  getTimeLabels,
  totalSlots,
  computeVisibleRange,
  timeToRow,
  timeSpanRows,
  parseTime,
  hasFridayEvents,
} from "@/lib/timetable-utils";
import { CourseBlock } from "./course-block";
import { CustomEventDialog } from "./custom-event-dialog";
import { cn } from "@/lib/utils";

interface WeekGridProps {
  events: TimetableEvent[];
  compact?: boolean;
}

export function WeekGrid({ events, compact = false }: WeekGridProps) {
  // Show Friday column only when there are Friday events.
  const showFriday = useMemo(() => hasFridayEvents(events), [events]);
  const visibleDays = useMemo(() => showFriday ? [...WEEKDAYS, 5 as Day] : WEEKDAYS, [showFriday]);
  const dayCount = visibleDays.length;

  // Base range from real (non-preview) events — snaps back when courses are removed.
  // Preview events can temporarily expand the range but don't persist.
  const realEvents = useMemo(() => events.filter((e) => !e.isPreview), [events]);
  const baseRange = useMemo(() => computeVisibleRange(realEvents), [realEvents]);
  const fullRange = computeVisibleRange(events);
  const startHour = Math.min(baseRange.startHour, fullRange.startHour);
  const endHour = Math.max(baseRange.endHour, fullRange.endHour);
  const slotCount = totalSlots(startHour, endHour);
  const timeLabels = useMemo(() => getTimeLabels(startHour, endHour), [startHour, endHour]);
  const [customDialog, setCustomDialog] = useState<{
    open: boolean;
    day: Day;
    startRow: number;
    endRow?: number;
    editId?: string;
    editTitle?: string;
  }>({ open: false, day: 0, startRow: 0 });

  // Drag state for selecting time range
  const [dragState, setDragState] = useState<{
    active: boolean;
    day: Day;
    startRow: number;
    currentRow: number;
  } | null>(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<Day, TimetableEvent[]>();
    for (const day of visibleDays) {
      map.set(day, events.filter((e) => e.day === day));
    }
    return map;
  }, [events, visibleDays]);

  const handleDragStart = useCallback((day: Day, row: number) => {
    setDragState({ active: true, day, startRow: row, currentRow: row });
  }, []);

  const handleDragMove = useCallback((day: Day, row: number) => {
    setDragState((prev) => {
      if (!prev || !prev.active || prev.day !== day) return prev;
      return { ...prev, currentRow: row };
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragState) return;
    const startRow = Math.min(dragState.startRow, dragState.currentRow);
    const endRow = Math.max(dragState.startRow, dragState.currentRow) + 2; // +2 for minimum 1 hour
    setCustomDialog({
      open: true,
      day: dragState.day,
      startRow,
      endRow: Math.min(endRow, slotCount),
    });
    setDragState(null);
  }, [dragState]);

  const handleCustomEventClick = useCallback((eventId: string) => {
    const evt = events.find((e) => e.customEventId === eventId);
    if (!evt) return;
    const row = timeToRow(evt.startTime, startHour);
    setCustomDialog({
      open: true,
      day: evt.day,
      startRow: row,
      editId: eventId,
      editTitle: evt.courseName,
    });
  }, [events]);

  return (
    <>
      <div
        className={cn(
          "w-full overflow-x-auto rounded-lg border border-border bg-card select-none",
          compact ? "text-[0.6rem]" : "text-sm",
        )}
      >
        <div
          className="grid min-w-0"
          style={{
            gridTemplateColumns: compact
              ? `36px repeat(${dayCount}, 1fr)`
              : `56px repeat(${dayCount}, 1fr)`,
            gridTemplateRows: `auto repeat(${slotCount}, minmax(${compact ? "2.5vh" : "4.2vh"}, 1fr))`,
          }}
          dir="rtl"
        >
          {/* Header row */}
          <div className="sticky top-0 z-10 bg-card border-b border-border" />
          {visibleDays.map((day) => (
            <div
              key={day}
              className={cn(
                "sticky top-0 z-10 bg-card border-b border-border",
                "flex items-center justify-center font-semibold py-2",
                compact ? "text-[0.65rem] py-1" : "text-sm",
              )}
            >
              {DAY_NAMES[day]}
            </div>
          ))}

          {/* Time labels — one per hour, each spanning 2 grid rows */}
          {timeLabels.map((label) => {
            const labelMinutes = parseTime(label);
            const row = Math.round((labelMinutes - startHour * 60) / SLOT_MINUTES);
            return (
              <div
                key={label}
                className={cn(
                  "border-t border-border/50 flex items-start justify-center",
                  "text-muted-foreground pt-0.5",
                  compact ? "text-[0.55rem]" : "text-xs",
                )}
                style={{
                  gridRow: `${row + 2} / span 2`,
                  gridColumn: 1,
                }}
              >
                {label}
              </div>
            );
          })}

          {/* Day columns */}
          {visibleDays.map((day, idx) => (
            <DayColumn
              key={day}
              day={day}
              events={eventsByDay.get(day) ?? []}
              compact={compact}
              slotCount={slotCount}
              startHour={startHour}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onCustomEventClick={handleCustomEventClick}
              dragState={dragState?.day === day ? dragState : null}
              colIndex={idx}
            />
          ))}
        </div>
      </div>

      <CustomEventDialog
        open={customDialog.open}
        onClose={() => setCustomDialog((s) => ({ ...s, open: false }))}
        day={customDialog.day}
        startRow={customDialog.startRow}
        endRow={customDialog.endRow}
        editingEventId={customDialog.editId}
        editingTitle={customDialog.editTitle}
      />
    </>
  );
}

/** Lay out events into non-overlapping columns (like FullCalendar's slotEventOverlap:false).
 *  Returns positioned events with left/width percentages within the column. */
function layoutEvents(
  events: TimetableEvent[],
  startHour: number,
  slotCount: number,
): { event: TimetableEvent; topPct: number; heightPct: number; leftPct: number; widthPct: number }[] {
  if (events.length === 0) return [];

  // Sort by start time, then by duration (longer first for stable layout).
  const sorted = [...events].sort((a, b) => {
    const aStart = parseTime(a.startTime);
    const bStart = parseTime(b.startTime);
    if (aStart !== bStart) return aStart - bStart;
    return parseTime(b.endTime) - parseTime(a.endTime);
  });

  // Assign each event to a column, tracking end times per column.
  const columns: number[] = []; // end time (in minutes) of each column
  const eventCols: number[] = [];
  const eventGroups: number[] = []; // which overlap group each event belongs to
  const groupMaxCols: number[] = []; // max columns used per group

  let currentGroupStart = 0;
  let currentGroupEnd = 0;
  let groupIndex = -1;

  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i];
    const evStart = parseTime(ev.startTime);
    const evEnd = parseTime(ev.endTime);

    // Check if this event starts a new non-overlapping group
    if (evStart >= currentGroupEnd) {
      groupIndex++;
      currentGroupStart = evStart;
      currentGroupEnd = evEnd;
      columns.length = 0; // reset columns for new group
    } else {
      currentGroupEnd = Math.max(currentGroupEnd, evEnd);
    }

    // Find first column where the event fits (no overlap)
    let col = 0;
    while (col < columns.length && columns[col] > evStart) {
      col++;
    }
    columns[col] = evEnd;
    eventCols[i] = col;
    eventGroups[i] = groupIndex;
    groupMaxCols[groupIndex] = Math.max(groupMaxCols[groupIndex] ?? 0, col + 1);
  }

  return sorted.map((event, i) => {
    const row = timeToRow(event.startTime, startHour);
    const span = timeSpanRows(event.startTime, event.endTime);
    const totalCols = groupMaxCols[eventGroups[i]];
    const col = eventCols[i];

    return {
      event,
      topPct: (row / slotCount) * 100,
      heightPct: (span / slotCount) * 100,
      leftPct: (col / totalCols) * 100,
      widthPct: (1 / totalCols) * 100,
    };
  });
}

interface DayColumnProps {
  day: Day;
  events: TimetableEvent[];
  compact: boolean;
  slotCount: number;
  startHour: number;
  onDragStart: (day: Day, row: number) => void;
  onDragMove: (day: Day, row: number) => void;
  onDragEnd: () => void;
  onCustomEventClick: (eventId: string) => void;
  dragState: { startRow: number; currentRow: number } | null;
  /** 0-based index within the visible day columns */
  colIndex: number;
}

function DayColumn({
  day,
  events,
  compact,
  slotCount,
  startHour,
  onDragStart,
  onDragMove,
  onDragEnd,
  onCustomEventClick,
  dragState,
  colIndex,
}: DayColumnProps) {
  const dayCol = colIndex + 2; // +1 for 1-based grid, +1 for time label column
  const colRef = useRef<HTMLDivElement>(null);

  const getRowFromY = (clientY: number): number => {
    if (!colRef.current) return 0;
    const rect = colRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    return Math.max(0, Math.min(Math.floor((y / rect.height) * slotCount), slotCount - 1));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // left click only
    e.preventDefault();
    onDragStart(day, getRowFromY(e.clientY));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return;
    onDragMove(day, getRowFromY(e.clientY));
  };

  const handleMouseUp = () => {
    if (!dragState) return;
    onDragEnd();
  };

  // Drag selection overlay
  const dragOverlay = dragState ? (() => {
    const top = Math.min(dragState.startRow, dragState.currentRow);
    const bottom = Math.max(dragState.startRow, dragState.currentRow) + 1;
    return {
      top: `${(top / slotCount) * 100}%`,
      height: `${((bottom - top) / slotCount) * 100}%`,
    };
  })() : null;

  return (
    <div
      ref={colRef}
      className="relative border-s border-border/30 cursor-cell"
      style={{
        gridColumn: dayCol,
        gridRow: `2 / span ${slotCount}`,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background grid lines — every hour (2 slots) */}
      {Array.from({ length: Math.floor(slotCount / 2) }, (_, i) => (
        <div
          key={i}
          className="absolute inset-x-0 border-t border-border/30 pointer-events-none"
          style={{ top: `${((i * 2) / slotCount) * 100}%` }}
        />
      ))}

      {/* Drag selection overlay */}
      {dragOverlay && (
        <div
          className="absolute inset-x-0.5 rounded bg-primary/20 border-2 border-primary/40 border-dashed z-[3] pointer-events-none"
          style={dragOverlay}
        />
      )}

      {/* Course blocks — absolutely positioned, with column layout for overlaps */}
      {layoutEvents(events, startHour, slotCount).map(({ event, topPct, heightPct, leftPct, widthPct }) => (
        <div
          key={`${event.courseId}-${event.groupId}-${event.startTime}-${event.isPreview}`}
          className="absolute z-[2]"
          style={{
            top: `${topPct}%`,
            height: `${heightPct}%`,
            right: `${leftPct}%`,
            width: `${widthPct}%`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <CourseBlock
            event={event}
            compact={compact}
            onCustomEventClick={onCustomEventClick}
          />
        </div>
      ))}
    </div>
  );
}
