import { useMemo, useState, useCallback, useRef } from "react";
import type { Day, TimetableEvent } from "@/types/timetable";
import {
  DAY_LABELS,
  DAYS,
  DEFAULT_START_HOUR,
  DEFAULT_END_HOUR,
  getTimeLabels,
  computeVisibleRange,
  totalSlots,
  timeToRow,
  timeSpanRows,
} from "@/lib/timetable-utils";
import { useTimetableStore } from "@/stores/timetable-store";
import { CourseBlock } from "./course-block";
import { CustomEventDialog } from "./custom-event-dialog";
import { cn } from "@/lib/utils";

interface DayViewProps {
  events: TimetableEvent[];
}

export function DayView({ events }: DayViewProps) {
  const selectedDay = useTimetableStore((s) => s.selectedDay);
  const setSelectedDay = useTimetableStore((s) => s.setSelectedDay);

  // Only expand range, never shrink (prevents grid jumps)
  const rangeRef = useRef({ startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR });
  const computed = computeVisibleRange(events);
  if (computed.startHour < rangeRef.current.startHour) rangeRef.current.startHour = computed.startHour;
  if (computed.endHour > rangeRef.current.endHour) rangeRef.current.endHour = computed.endHour;
  const { startHour, endHour } = rangeRef.current;
  const slotCount = totalSlots(startHour, endHour);
  const timeLabels = useMemo(() => getTimeLabels(startHour, endHour), [startHour, endHour]);

  const colRef = useRef<HTMLDivElement>(null);

  const [customDialog, setCustomDialog] = useState<{
    open: boolean;
    day: Day;
    startRow: number;
    endRow?: number;
    editId?: string;
    editTitle?: string;
  }>({ open: false, day: 0, startRow: 0 });

  const [dragState, setDragState] = useState<{
    startRow: number;
    currentRow: number;
  } | null>(null);

  const dayEvents = useMemo(
    () => events.filter((e) => e.day === selectedDay),
    [events, selectedDay],
  );

  const getRowFromY = (clientY: number): number => {
    if (!colRef.current) return 0;
    const rect = colRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    return Math.max(0, Math.min(Math.floor((y / rect.height) * slotCount), slotCount - 1));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const row = getRowFromY(e.clientY);
    setDragState({ startRow: row, currentRow: row });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return;
    setDragState((prev) => prev ? { ...prev, currentRow: getRowFromY(e.clientY) } : null);
  };

  const handleMouseUp = () => {
    if (!dragState) return;
    const startRow = Math.min(dragState.startRow, dragState.currentRow);
    const endRow = Math.max(dragState.startRow, dragState.currentRow) + 2;
    setCustomDialog({
      open: true,
      day: selectedDay,
      startRow,
      endRow: Math.min(endRow, slotCount),
    });
    setDragState(null);
  };

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

  const dragOverlay = dragState ? (() => {
    const top = Math.min(dragState.startRow, dragState.currentRow);
    const bottom = Math.max(dragState.startRow, dragState.currentRow) + 1;
    return {
      top: `${(top / slotCount) * 100}%`,
      height: `${((bottom - top) / slotCount) * 100}%`,
    };
  })() : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Day pills */}
      <div className="flex justify-center gap-1.5" dir="rtl">
        {DAYS.map((day) => {
          const hasEvents = events.some((e) => e.day === day);
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "relative px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                day === selectedDay
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-accent",
              )}
            >
              {DAY_LABELS[day]}
              {hasEvents && day !== selectedDay && (
                <span className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Single day grid */}
      <div className="rounded-lg border border-border bg-card overflow-hidden select-none">
        <div
          className="grid"
          style={{
            gridTemplateColumns: "56px 1fr",
            gridTemplateRows: `repeat(${slotCount}, minmax(min(4.2vh, 44px), 1fr))`,
          }}
          dir="rtl"
        >
          {/* Time labels */}
          {timeLabels.map((label, i) => (
            <div
              key={label}
              className="border-t border-border/50 flex items-start justify-center text-muted-foreground text-xs pt-0.5"
              style={{
                gridRow: `${i * 2 + 1} / span 2`,
                gridColumn: 1,
              }}
            >
              {label}
            </div>
          ))}

          {/* Events column */}
          <div
            ref={colRef}
            className="relative border-s border-border/30 cursor-cell"
            style={{
              gridColumn: 2,
              gridRow: `1 / span ${slotCount}`,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Hour grid lines */}
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
                className="absolute inset-x-1 rounded bg-primary/20 border-2 border-primary/40 border-dashed z-[3] pointer-events-none"
                style={dragOverlay}
              />
            )}

            {/* Course blocks — absolutely positioned */}
            {dayEvents.map((event) => {
              const row = timeToRow(event.startTime, startHour);
              const span = timeSpanRows(event.startTime, event.endTime);
              const topPct = (row / slotCount) * 100;
              const heightPct = (span / slotCount) * 100;

              return (
                <div
                  key={`${event.courseId}-${event.groupId}-${event.startTime}`}
                  className="absolute inset-x-1 z-[2]"
                  style={{
                    top: `${topPct}%`,
                    height: `${heightPct}%`,
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <CourseBlock
                    event={event}
                    onCustomEventClick={handleCustomEventClick}
                  />
                </div>
              );
            })}
          </div>
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
    </div>
  );
}
