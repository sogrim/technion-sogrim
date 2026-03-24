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
export const START_HOUR = 8;
export const END_HOUR = 20;
export const SLOT_MINUTES = 30;
export const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;
export const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;

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
export function timeToRow(time: string): number {
  const minutes = parseTime(time);
  return (minutes - START_HOUR * 60) / SLOT_MINUTES;
}

/** Number of grid rows a time range spans */
export function timeSpanRows(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  return (end - start) / SLOT_MINUTES;
}

/** Generate time labels for the grid */
export function getTimeLabels(): string[] {
  const labels: string[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
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
