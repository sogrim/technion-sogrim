import { useMemo, useState, useCallback, useRef } from "react";
import type { Day, TimetableEvent } from "@/types/timetable";
import {
  DAY_NAMES,
  DAYS,
  getTimeLabels,
  totalSlots,
  computeVisibleRange,
  timeToRow,
  timeSpanRows,
} from "@/lib/timetable-utils";
import { CourseBlock } from "./course-block";
import { CustomEventDialog } from "./custom-event-dialog";
import { cn } from "@/lib/utils";

interface WeekGridProps {
  events: TimetableEvent[];
  compact?: boolean;
}

export function WeekGrid({ events, compact = false }: WeekGridProps) {
  const { startHour, endHour } = useMemo(() => computeVisibleRange(events), [events]);
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
    for (const day of DAYS) {
      map.set(day, events.filter((e) => e.day === day));
    }
    return map;
  }, [events]);

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
              ? "36px repeat(5, 1fr)"
              : "56px repeat(5, 1fr)",
            gridTemplateRows: `auto repeat(${slotCount}, minmax(${compact ? "2.5vh" : "4.2vh"}, 1fr))`,
          }}
          dir="rtl"
        >
          {/* Header row */}
          <div className="sticky top-0 z-10 bg-card border-b border-border" />
          {DAYS.map((day) => (
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

          {/* Time labels */}
          {timeLabels.map((label, i) => (
            <div
              key={label}
              className={cn(
                "border-t border-border/50 flex items-start justify-center",
                "text-muted-foreground pt-0.5",
                compact ? "text-[0.55rem]" : "text-xs",
              )}
              style={{
                gridRow: `${i * 2 + 2} / span 2`,
                gridColumn: 1,
              }}
            >
              {label}
            </div>
          ))}

          {/* Day columns */}
          {DAYS.map((day) => (
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
}: DayColumnProps) {
  const dayCol = day + 2;
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
      {/* Background grid lines */}
      {Array.from({ length: slotCount / 2 }, (_, i) => (
        <div
          key={i}
          className="absolute inset-x-0 border-t border-border/30 pointer-events-none"
          style={{ top: `${(i * 2 / slotCount) * 100}%` }}
        />
      ))}

      {/* Drag selection overlay */}
      {dragOverlay && (
        <div
          className="absolute inset-x-0.5 rounded bg-primary/20 border-2 border-primary/40 border-dashed z-[3] pointer-events-none"
          style={dragOverlay}
        />
      )}

      {/* Course blocks — absolutely positioned */}
      {events.map((event) => {
        const row = timeToRow(event.startTime, startHour);
        const span = timeSpanRows(event.startTime, event.endTime);
        const topPct = (row / slotCount) * 100;
        const heightPct = (span / slotCount) * 100;

        return (
          <div
            key={`${event.courseId}-${event.groupId}-${event.startTime}-${event.isPreview}`}
            className="absolute inset-x-0.5 z-[2]"
            style={{
              top: `${topPct}%`,
              height: `${heightPct}%`,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <CourseBlock
              event={event}
              compact={compact}
              onCustomEventClick={onCustomEventClick}
            />
          </div>
        );
      })}
    </div>
  );
}
