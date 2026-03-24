import { useState, useRef, useEffect } from "react";
import type { Day } from "@/types/timetable";
import { useTimetableStore } from "@/stores/timetable-store";
import { DAY_NAMES, formatTime, START_HOUR, SLOT_MINUTES } from "@/lib/timetable-utils";
import { cn } from "@/lib/utils";
import { X, Clock, Pencil } from "lucide-react";

const EVENT_COLORS = [
  { id: "gray", bg: "oklch(0.65 0.02 250)", label: "אפור" },
  { id: "blue", bg: "oklch(0.65 0.15 250)", label: "כחול" },
  { id: "purple", bg: "oklch(0.60 0.16 300)", label: "סגול" },
  { id: "green", bg: "oklch(0.65 0.15 155)", label: "ירוק" },
  { id: "orange", bg: "oklch(0.70 0.15 55)", label: "כתום" },
  { id: "pink", bg: "oklch(0.65 0.16 350)", label: "ורוד" },
  { id: "teal", bg: "oklch(0.65 0.12 185)", label: "טורקיז" },
];

interface CustomEventDialogProps {
  open: boolean;
  onClose: () => void;
  day: Day;
  startRow: number;
  /** End row from drag selection (exclusive). If not provided, uses duration buttons. */
  endRow?: number;
  editingEventId?: string;
  editingTitle?: string;
}

export function CustomEventDialog({
  open,
  onClose,
  day,
  startRow,
  endRow,
  editingEventId,
  editingTitle,
}: CustomEventDialogProps) {
  const [title, setTitle] = useState(editingTitle ?? "");
  const [duration, setDuration] = useState(2);
  const [selectedColor, setSelectedColor] = useState("blue");
  const inputRef = useRef<HTMLInputElement>(null);
  const addCustomEvent = useTimetableStore((s) => s.addCustomEvent);
  const updateCustomEvent = useTimetableStore((s) => s.updateCustomEvent);
  const removeCustomEvent = useTimetableStore((s) => s.removeCustomEvent);

  const startMinutes = START_HOUR * 60 + startRow * SLOT_MINUTES;
  // If endRow provided (from drag), calculate duration from it. Otherwise use duration buttons.
  const effectiveEndMinutes = endRow != null
    ? START_HOUR * 60 + endRow * SLOT_MINUTES
    : startMinutes + duration * 60;
  const startTime = formatTime(startMinutes);
  const endTime = formatTime(Math.min(effectiveEndMinutes, 20 * 60));

  const hasDragRange = endRow != null;

  useEffect(() => {
    if (open) {
      setTitle(editingTitle ?? "");
      setSelectedColor("blue");
      if (endRow != null) {
        const dragDuration = (endRow - startRow) * SLOT_MINUTES / 60;
        setDuration(dragDuration);
      } else {
        setDuration(2);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, editingTitle, startRow, endRow]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (editingEventId) {
      updateCustomEvent(editingEventId, {
        title: title.trim(),
        color: selectedColor,
      });
    } else {
      addCustomEvent({
        title: title.trim(),
        day,
        startTime,
        endTime,
        color: selectedColor,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (editingEventId) {
      removeCustomEvent(editingEventId);
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div
        className={cn(
          "fixed z-50 bg-card rounded-xl shadow-2xl border border-border p-4",
          "animate-in fade-in-0 zoom-in-95 duration-150",
          "inset-x-4 top-[25%] md:inset-auto",
          "md:top-[25%] md:left-1/2 md:-translate-x-1/2 md:w-80",
        )}
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Pencil className="h-4 w-4 text-primary" />
            {editingEventId ? "עריכת אירוע" : "אירוע מותאם אישית"}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") onClose();
            }}
            placeholder="תיאור האירוע..."
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>יום {DAY_NAMES[day]}</span>
            <span className="font-mono">{startTime} - {endTime}</span>
          </div>

          {/* Duration — only shown if no drag range */}
          {!hasDragRange && !editingEventId && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">משך:</span>
              {[1, 1.5, 2, 3, 4].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium transition-all",
                    d === duration
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent",
                  )}
                >
                  {d}h
                </button>
              ))}
            </div>
          )}

          {/* Color picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">צבע:</span>
            <div className="flex gap-1">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(c.id)}
                  title={c.label}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all",
                    selectedColor === c.id && "ring-2 ring-offset-2 ring-primary",
                  )}
                  style={{ backgroundColor: c.bg }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {editingEventId ? "שמור" : "הוסף"}
            </button>
            {editingEventId && (
              <button
                onClick={handleDelete}
                className="px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                מחק
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
