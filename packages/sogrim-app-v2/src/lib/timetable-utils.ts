import type { Day, LessonType } from "@/types/timetable";

/** Day names in Hebrew, indexed by Day (0=Sunday) */
export const DAY_NAMES: Record<Day, string> = {
  0: "ראשון",
  1: "שני",
  2: "שלישי",
  3: "רביעי",
  4: "חמישי",
};

/** Short day labels for pills */
export const DAY_LABELS: Record<Day, string> = {
  0: "א׳",
  1: "ב׳",
  2: "ג׳",
  3: "ד׳",
  4: "ה׳",
};

export const LESSON_TYPE_NAMES: Record<LessonType, string> = {
  lecture: "הרצאה",
  tutorial: "תרגול",
  lab: "מעבדה",
  seminar: "סמינר",
};

/** Grid hours range */
export const DEFAULT_START_HOUR = 8;
export const DEFAULT_END_HOUR = 18; // Show up to 17:30 by default
export const MIN_START_HOUR = 7;    // Can shrink down to 07:00
export const MAX_END_HOUR = 23;     // Can expand up to 22:30
export const SLOT_MINUTES = 30;
export const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;

/** Compute visible start and end hours based on events. */
export function computeVisibleRange(events: { startTime: string; endTime: string }[]): {
  startHour: number;
  endHour: number;
} {
  let earliest = DEFAULT_START_HOUR * 60;
  let latest = DEFAULT_END_HOUR * 60;
  for (const e of events) {
    const start = parseTime(e.startTime);
    const end = parseTime(e.endTime);
    if (start < earliest) earliest = start;
    if (end > latest) latest = end;
  }
  return {
    startHour: Math.max(Math.floor(earliest / 60), MIN_START_HOUR),
    endHour: Math.min(Math.ceil(latest / 60), MAX_END_HOUR),
  };
}

/** Total slots for a given range */
export function totalSlots(startHour: number, endHour: number): number {
  return (endHour - startHour) * SLOTS_PER_HOUR;
}


/** Parse "HH:MM" into minutes since midnight */
export function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Format minutes since midnight to "HH:MM" */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Convert time to grid row index (0-based, each row = SLOT_MINUTES) */
export function timeToRow(time: string, startHour?: number): number {
  const minutes = parseTime(time);
  return (minutes - (startHour ?? DEFAULT_START_HOUR) * 60) / SLOT_MINUTES;
}

/** Number of grid rows a time range spans */
export function timeSpanRows(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  return (end - start) / SLOT_MINUTES;
}

/** Generate time labels for the grid */
export function getTimeLabels(startHour?: number, endHour?: number): string[] {
  const start = startHour ?? DEFAULT_START_HOUR;
  const end = endHour ?? DEFAULT_END_HOUR;
  const labels: string[] = [];
  for (let h = start; h < end; h++) {
    labels.push(formatTime(h * 60));
  }
  return labels;
}

/** All days in order */
export const DAYS: Day[] = [0, 1, 2, 3, 4];

/** Generate a unique draft ID */
export function generateDraftId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Hebrew draft name by index */
const DRAFT_LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח"];
export function defaultDraftName(index: number): string {
  const letter = DRAFT_LETTERS[index] ?? String(index + 1);
  return `אפשרות ${letter}׳`;
}
