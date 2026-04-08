import type {
  CourseSchedule,
  Semester,
  LessonGroup,
  Lesson,
  Day,
  LessonType,
} from "@/types/timetable";
import type { CourseScheduleProvider } from "./course-schedule-provider";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// ---------------------------------------------------------------------------
// SAP API response types (matching the Rust backend)
// ---------------------------------------------------------------------------

interface SapCourseDetails {
  id: string;
  name: string;
  credits: number;
  faculty?: string;
  syllabus?: string;
  academic_level?: string;
  semester_note?: string;
  exams: SapExam[];
  relations: SapRelation[];
  prerequisites: SapPrereqToken[];
  corequisites: string[];
  responsible: SapPerson[];
  offered_periods: SapOfferedPeriod[];
  schedule: SapScheduleGroup[];
}

interface SapExam {
  category: string;
  category_code: string;
  date?: string;
  begin_time?: string;
  end_time?: string;
  note?: string;
}

interface SapRelation {
  course_id: string;
  type: "no_additional_credit" | "contains" | "contained_in";
}

interface SapPrereqToken {
  module_id?: string;
  operator?: string;
  bracket?: string;
}

interface SapPerson {
  name: string;
  title?: string;
}

interface SapOfferedPeriod {
  year: string;
  semester: string;
  semester_name: string;
  year_name: string;
}

interface SapScheduleGroup {
  group: string;
  /** Group-level name (e.g. "נבחרת טניס נשים" for sport courses). */
  name?: string;
  events: SapScheduleEvent[];
}

interface SapScheduleEvent {
  kind: string;
  day?: number;
  start_time?: string;
  end_time?: string;
  schedule_text: string;
  building?: string;
  room?: string;
  lecturer?: string;
}

interface SapSemester {
  year: string;
  semester: string;
  begin_date: string;
  end_date: string;
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

const KIND_MAP: Record<string, LessonType> = {
  "הרצאה": "lecture",
  "תרגול": "tutorial",
  "מעבדה": "lab",
  "סמינר": "seminar",
  "פרויקט": "seminar",
};

function mapKind(kind: string): LessonType {
  return KIND_MAP[kind] ?? "lecture";
}

function sapDateToISO(dateStr: string): string {
  // "DD-MM-YYYY" → "YYYY-MM-DD"
  const [d, m, y] = dateStr.split("-");
  return `${y}-${m}-${d}`;
}

function formatPrerequisites(tokens: SapPrereqToken[]): string {
  return tokens
    .map((t) => {
      let s = "";
      if (t.bracket) s += t.bracket;
      if (t.module_id) s += t.module_id;
      if (t.operator === "AND") s += " ו-";
      else if (t.operator === "OR") s += " או ";
      return s;
    })
    .join("")
    .trim();
}

function semesterCodeToSeason(code: string): "fall" | "spring" | "summer" {
  if (code === "200") return "fall";
  if (code === "201") return "spring";
  return "summer";
}

function semesterCodeToName(code: string): string {
  if (code === "200") return "חורף";
  if (code === "201") return "אביב";
  return "קיץ";
}

function semesterDisplayName(code: string, acYear: number): string {
  const label = semesterCodeToName(code);
  if (code === "200") return `${label} ${acYear}-${acYear + 1}`;
  // Spring and summer both use acYear+1 (summer 2024/202 = קיץ 2025)
  return `${label} ${acYear + 1}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function computeHours(groups: LessonGroup[], type: LessonType): number | undefined {
  const group = groups.find((g) => g.type === type);
  if (!group || group.lessons.length === 0) return undefined;
  const total = group.lessons.reduce((sum, l) => {
    return sum + (timeToMinutes(l.endTime) - timeToMinutes(l.startTime)) / 60;
  }, 0);
  return total > 0 ? Math.round(total * 10) / 10 : undefined;
}

// ---------------------------------------------------------------------------
// Convert SAP response → frontend CourseSchedule
// ---------------------------------------------------------------------------

/** Hash a set of lessons for deduplication. Same kind+day+time+building+room = same event. */
function lessonsHash(lessons: Lesson[]): string {
  return lessons
    .map((l) => `${l.day}|${l.startTime}|${l.endTime}|${l.building ?? ""}|${l.room ?? ""}`)
    .sort()
    .join(";");
}

function toSchedule(sap: SapCourseDetails): CourseSchedule {
  // First pass: build per-SAP-group lesson groups.
  const rawGroups: { groupNum: string; type: LessonType; rawKind: string; lessons: Lesson[] }[] = [];

  for (const sapGroup of sap.schedule) {
    const byKind = new Map<LessonType, { lessons: Lesson[]; rawKind: string }>();

    for (const event of sapGroup.events) {
      if (event.day == null || !event.start_time || !event.end_time) continue;
      if (event.day > 5) continue;

      const type = mapKind(event.kind);
      if (!byKind.has(type)) byKind.set(type, { lessons: [], rawKind: event.kind });
      byKind.get(type)!.lessons.push({
        day: event.day as Day,
        startTime: event.start_time,
        endTime: event.end_time,
        building: event.building ?? undefined,
        room: event.room ?? undefined,
        instructor: event.lecturer ?? undefined,
      });
    }

    for (const [type, { lessons, rawKind }] of byKind) {
      rawGroups.push({ groupNum: sapGroup.group, type, rawKind, lessons });
    }
  }

  // Second pass: deduplicate groups that share identical lessons (e.g. shared lectures).
  // Groups with the same type + lessons hash are merged into one group with combined ID.
  const deduped = new Map<string, { groupNums: string[]; type: LessonType; rawKind: string; lessons: Lesson[] }>();

  for (const g of rawGroups) {
    const key = `${g.type}:${lessonsHash(g.lessons)}`;
    const existing = deduped.get(key);
    if (existing) {
      existing.groupNums.push(g.groupNum);
    } else {
      deduped.set(key, { groupNums: [g.groupNum], type: g.type, rawKind: g.rawKind, lessons: g.lessons });
    }
  }

  const groups: LessonGroup[] = [];
  for (const { groupNums, type, rawKind, lessons } of deduped.values()) {
    const id = groupNums.join("/") + `-${type}`;
    groups.push({ id, type, kindLabel: rawKind, lessons });
  }

  const examA = sap.exams.find((e) => e.category_code === "FI");
  const examB = sap.exams.find((e) => e.category_code === "FB");

  const noExtraCredit = sap.relations
    .filter((r) => r.type === "no_additional_credit")
    .map((r) => r.course_id)
    .join(", ");

  return {
    id: sap.id,
    name: sap.name,
    credit: sap.credits,
    faculty: sap.faculty,
    groups,
    syllabus: sap.syllabus,
    prerequisites: formatPrerequisites(sap.prerequisites) || undefined,
    linkedCourses: sap.corequisites.join(", ") || undefined,
    noExtraCreditCourses: noExtraCredit || undefined,
    lecturerInCharge: sap.responsible
      .map((r) => (r.title ? `${r.title} ${r.name}` : r.name))
      .join(", ") || undefined,
    examA: examA?.date ? sapDateToISO(examA.date) : undefined,
    examB: examB?.date ? sapDateToISO(examB.date) : undefined,
    examATime:
      examA?.begin_time && examA?.end_time
      && (examA.begin_time !== "00:00" || examA.end_time !== "00:00")
        ? `${examA.begin_time} - ${examA.end_time}`
        : undefined,
    examBTime:
      examB?.begin_time && examB?.end_time
      && (examB.begin_time !== "00:00" || examB.end_time !== "00:00")
        ? `${examB.begin_time} - ${examB.end_time}`
        : undefined,
    lectureHours: computeHours(groups, "lecture"),
    tutorialHours: computeHours(groups, "tutorial"),
    labHours: computeHours(groups, "lab"),
    notes: sap.semester_note,
  };
}

// ---------------------------------------------------------------------------
// ApiProvider
// ---------------------------------------------------------------------------

type Listener = () => void;

/**
 * Course schedule provider backed by the Rust SAP API.
 *
 * Uses a cache + background-fetch pattern to satisfy the synchronous
 * CourseScheduleProvider interface. Components subscribe via `onChange`
 * to re-render when data arrives.
 */
interface CourseIndexEntry {
  id: string;
  name: string;
  faculty?: string;
  credits: number;
}

export class ApiProvider implements CourseScheduleProvider {
  private cache = new Map<string, CourseSchedule>();
  private index: CourseIndexEntry[] = [];
  private semesterList: Semester[] = [];
  private inflight = new Set<string>();
  private listeners: Listener[] = [];
  private year = "";
  private semesterCode = "";
  private indexLoading = false;
  private _version = 0;

  /** Subscribe to data changes (triggers React re-renders). */
  onChange(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Monotonically increasing version — changes on every notify. */
  get version(): number {
    return this._version;
  }

  private notify() {
    this._version++;
    for (const l of this.listeners) l();
  }

  /** Fetch semesters + course IDs for the latest semester. */
  async init(): Promise<void> {
    const semResp = await fetch(`${API_URL}/semesters`);
    const semData: SapSemester[] = await semResp.json();

    this.semesterList = semData
      .filter((s) => ["200", "201", "202"].includes(s.semester))
      .map((s) => ({
        id: `${s.year}-${s.semester}`,
        name: semesterDisplayName(s.semester, parseInt(s.year)),
        year: parseInt(s.year),
        season: semesterCodeToSeason(s.semester),
      }));

    if (this.semesterList.length > 0) {
      const latest = this.semesterList[0];
      this.year = String(latest.year);
      this.semesterCode =
        latest.season === "fall"
          ? "200"
          : latest.season === "spring"
            ? "201"
            : "202";
    }

    await this.fetchIndex();
  }

  /** Switch to a different semester. Clears cache and refetches index. */
  async switchSemester(semesterId: string): Promise<void> {
    const [year, code] = semesterId.split("-");
    if (!year || !code) return;
    if (this.year === year && this.semesterCode === code) return;

    this.year = year;
    this.semesterCode = code;
    this.cache.clear();
    this.inflight.clear();
    this.index = [];
    this.notify();

    await this.fetchIndex();
  }

  private async fetchIndex(): Promise<void> {
    if (!this.year || !this.semesterCode) {
      this.index = [];
      return;
    }
    this.indexLoading = true;
    try {
      const indexResp = await fetch(
        `${API_URL}/courses/${this.year}/${this.semesterCode}/index`,
      );
      if (!indexResp.ok) {
        this.index = [];
        return;
      }
      this.index = await indexResp.json();
    } finally {
      this.indexLoading = false;
    }
    this.notify();
  }

  private async fetchAndCache(courseId: string): Promise<void> {
    if (this.cache.has(courseId) || this.inflight.has(courseId)) return;
    this.inflight.add(courseId);
    try {
      const resp = await fetch(
        `${API_URL}/courses/${this.year}/${this.semesterCode}/${courseId}`,
      );
      if (!resp.ok) return;
      const data: SapCourseDetails = await resp.json();
      this.cache.set(courseId, toSchedule(data));
      this.notify();
    } finally {
      this.inflight.delete(courseId);
    }
  }

  /** Eagerly fetch a course. Returns a promise for the result. */
  async prefetch(courseId: string): Promise<CourseSchedule | undefined> {
    if (this.cache.has(courseId)) return this.cache.get(courseId);
    await this.fetchAndCache(courseId);
    return this.cache.get(courseId);
  }

  // -- CourseScheduleProvider interface (synchronous) --

  searchCourses(query: string): CourseSchedule[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // Search the index (has id, name, faculty for all courses)
    const matches = this.index.filter(
      (c) =>
        c.id.includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.faculty?.toLowerCase().includes(q),
    ).slice(0, 200);

    // Return full CourseSchedule from cache if available, otherwise a skeleton
    return matches.map((entry) => {
      if (this.cache.has(entry.id)) return this.cache.get(entry.id)!;

      // Trigger background fetch
      this.fetchAndCache(entry.id);

      // Return skeleton with real name/credits from index
      return {
        id: entry.id,
        name: entry.name,
        credit: entry.credits,
        faculty: entry.faculty,
        groups: [],
      } as CourseSchedule;
    });
  }

  getCourse(courseId: string): CourseSchedule | undefined {
    if (this.cache.has(courseId)) return this.cache.get(courseId);
    // Only fetch if the course exists in the current semester's index
    const entry = this.index.find((c) => c.id === courseId);
    if (entry) {
      this.fetchAndCache(courseId);
      return { id: entry.id, name: entry.name, credit: entry.credits, faculty: entry.faculty, groups: [] };
    }
    return undefined;
  }

  getAllCourses(): CourseSchedule[] {
    return this.index.map((entry) => {
      if (this.cache.has(entry.id)) return this.cache.get(entry.id)!;
      return { id: entry.id, name: entry.name, credit: entry.credits, faculty: entry.faculty, groups: [] };
    });
  }

  getSemesters(): Semester[] {
    return this.semesterList;
  }

  isLoading(): boolean {
    return this.indexLoading;
  }
}
