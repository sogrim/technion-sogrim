import type { Day, LessonType } from "@/types/timetable";

/** Day names in Hebrew, indexed by Day (0=Sunday) */
export const DAY_NAMES: Record<Day, string> = {
  0: "ראשון",
  1: "שני",
  2: "שלישי",
  3: "רביעי",
  4: "חמישי",
  5: "שישי",
};

/** Short day labels for pills */
export const DAY_LABELS: Record<Day, string> = {
  0: "א׳",
  1: "ב׳",
  2: "ג׳",
  3: "ד׳",
  4: "ה׳",
  5: "ו׳",
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
export const MAX_END_HOUR = 24;     // Can expand up to midnight
export const SLOT_MINUTES = 30;
export const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;

/** Compute visible start and end hours based on events.
 *  When there are no events, shows the default range (08:00-18:00).
 *  When there are events, fits to span from 1 hour before the earliest
 *  event to the hour after the latest event, with a minimum 10-hour window. */
export function computeVisibleRange(events: { startTime: string; endTime: string }[]): {
  startHour: number;
  endHour: number;
} {
  if (events.length === 0) {
    return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  }

  let earliest = Infinity;
  let latest = 0;
  for (const e of events) {
    const start = parseTime(e.startTime);
    const end = parseTime(e.endTime);
    if (start < earliest) earliest = start;
    if (end > latest) latest = end;
  }

  let startHour = Math.max(Math.floor(earliest / 60), MIN_START_HOUR);
  // Round up so the grid always contains the full last event
  let endHour = Math.min(Math.ceil(latest / 60), MAX_END_HOUR);

  // Ensure a minimum window of 10 hours for visual consistency
  const minWindow = 10;
  if (endHour - startHour < minWindow) {
    const mid = (startHour + endHour) / 2;
    startHour = Math.max(Math.floor(mid - minWindow / 2), MIN_START_HOUR);
    endHour = Math.min(startHour + minWindow, MAX_END_HOUR);
  }

  return { startHour, endHour };
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
export const DAYS: Day[] = [0, 1, 2, 3, 4, 5];

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
