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

/** Grid range in hours (can be half-hour values like 8.5 = 08:30).
 *  Defaults: 08:30 - 18:30. */
export const DEFAULT_START_HOUR = 8.5;
export const DEFAULT_END_HOUR = 18.5;
export const MIN_START_HOUR = 7;     // Can shrink down to 07:00
export const MAX_END_HOUR = 24;      // Can expand up to midnight
export const SLOT_MINUTES = 30;
export const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;

/** Compute visible start and end hours based on events.
 *  Snaps to 30-min boundaries.
 *  Returns values like 7.5 = 07:30, 8 = 08:00, 18.5 = 18:30. */
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

  // Floor to 30-min for start, ceil to 30-min for end.
  let startHour = Math.floor(earliest / 30) * 0.5;
  let endHour = Math.ceil(latest / 30) * 0.5;

  // Clamp to bounds
  startHour = Math.max(startHour, MIN_START_HOUR);
  endHour = Math.min(endHour, MAX_END_HOUR);

  // Don't shrink beyond defaults
  startHour = Math.min(startHour, DEFAULT_START_HOUR);
  endHour = Math.max(endHour, DEFAULT_END_HOUR);

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

/** Generate time labels for the grid — one per hour, aligned to startHour.
 *  E.g. if startHour is 7.5: labels are 07:30, 08:30, 09:30, ... */
export function getTimeLabels(startHour?: number, endHour?: number): string[] {
  const start = startHour ?? DEFAULT_START_HOUR;
  const end = endHour ?? DEFAULT_END_HOUR;
  const labels: string[] = [];
  for (let h = start; h < end; h += 1) {
    labels.push(formatTime(h * 60));
  }
  return labels;
}

/** Weekdays Sun-Thu (always shown) */
export const WEEKDAYS: Day[] = [0, 1, 2, 3, 4];

/** All days including Friday */
export const DAYS: Day[] = [0, 1, 2, 3, 4, 5];

/** Check whether any events fall on Friday */
export function hasFridayEvents(events: { day: number }[]): boolean {
  return events.some((e) => e.day === 5);
}

/** Generate a unique draft ID */
export function generateDraftId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

