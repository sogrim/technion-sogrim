export const Faculty = {
  Unknown: "Unknown",
  ComputerScience: "ComputerScience",
  DataAndDecisionScience: "DataAndDecisionScience",
  Medicine: "Medicine",
  ElectricalEngineering: "ElectricalEngineering",
} as const;
export type Faculty = (typeof Faculty)[keyof typeof Faculty];

/** Single source of truth for faculty display names. `Record<Faculty, string>`
 *  makes the build fail if a faculty is ever added without a label here. */
export const FACULTY_LABELS: Record<Faculty, string> = {
  Unknown: "כללי",
  ComputerScience: "מדעי המחשב",
  DataAndDecisionScience: "מדעי הנתונים וקבלת החלטות",
  Medicine: "רפואה",
  ElectricalEngineering: "הנדסת חשמל",
};

export const UserPermissions = {
  Student: "Student",
  Admin: "Admin",
  Owner: "Owner",
} as const;
export type UserPermissions = (typeof UserPermissions)[keyof typeof UserPermissions];

export type CourseState = "הושלם" | "לא הושלם" | "לא רלוונטי" | "בתהליך";
export type CourseGradeOptions =
  | "עבר"
  | "נכשל"
  | "פטור ללא ניקוד"
  | "פטור עם ניקוד"
  | "לא השלים";

export type SemesterSeason = "winter" | "spring" | "summer";

export interface AcademicSemester {
  season: SemesterSeason;
  start_year: number;
}

export interface Course {
  credit: number;
  name: string;
  _id: string;
}

export interface CourseStatus {
  course: Course;
  grade?: string;
  semester: AcademicSemester | null;
  state: CourseState;
  type?: string;
  modified: boolean;
  specialization_group_name?: string;
  additional_msg?: string;
  times_repeated: number;
}

export interface CourseBankReq {
  bank_rule_name: string;
  course_bank_name: string;
  credit_completed: number;
  credit_requirement: number;
  course_completed: number;
  course_requirement: number;
  message?: string;
  completed?: boolean;
  type: string;
}

export interface DegreeStatus {
  course_bank_requirements: CourseBankReq[];
  course_statuses: CourseStatus[];
  overflow_msgs: string[];
  total_credit: number;
}

export interface UserSettings {
  dark_mode: boolean;
  /** Optional palette ID; absent until the user picks one. */
  palette?: string;
}

export interface Catalog {
  name: string;
  faculty: string;
  total_credit: number;
  description: string;
  _id: { $oid: string };
  course_bank_names: string[];
  year: number;
}

export interface UserDetails {
  degree_status: DegreeStatus;
  catalog?: Catalog;
  compute_in_progress: boolean;
  modified: boolean;
  /** Hebrew gap labels on empty timeline slots, keyed by linear calendar idx
   *  (`year*3 + season`, winter/spring/summer = 0/1/2) as a string. Optional
   *  for backwards-compat with responses from servers that pre-date this field. */
  timeline_annotations?: Record<string, string>;
}

export interface UserState {
  _id: string;
  details: UserDetails;
  settings: UserSettings;
  permissions: UserPermissions;
}

export interface ComputeDegreeStatusPayload {
  catalogId: { $oid: string };
  gradeSheetAsString: string;
}

/* ───────────────────────────────────────────────────────────────────────
   Admin BI dashboard — mirrors the backend `DashboardStats` returned by
   `GET /api/admins/stats`. Field names are snake_case to match the Rust
   serde default used throughout the user/degree-status model. Every metric
   is computed from data already persisted on `Users` (no new persisted
   stats). Deferred/time-series metrics are intentionally absent (spec §7).
   The backend `DashboardStats` struct MUST serialize to exactly this shape.
   ─────────────────────────────────────────────────────────────────────── */

/** A `{ label, value }` pair for categorical bar/pie series. */
export interface CountBucket {
  label: string;
  value: number;
}

/** Overview KPI strip. Activity counts come from `last_seen` (login-only,
 *  hourly-throttled) and are point-in-time, not engagement-per-action. */
export interface OverviewStats {
  total_users: number;
  /** `last_seen` within 1 / 7 / 30 days. */
  dau: number;
  wau: number;
  mau: number;
  /** DAU / MAU as a fraction in [0, 1]. */
  stickiness: number;
  /** has `details.catalog`. */
  onboarded: number;
  /** non-empty `course_statuses`. */
  imported_grades: number;
  /** has a computed degree status. */
  computed_status: number;
}

/** Activity recency, bucketed from the single `last_seen` per user. */
export interface ActivityStats {
  /** `last_seen` <= 7d. */
  active: number;
  /** 7d < `last_seen` <= 30d. */
  dormant: number;
  /** `last_seen` > 30d (or never). */
  inactive: number;
  /** Proxy heatmap: 7 rows (day-of-week, 0 = Sunday) × 24 cols (hour),
   *  each cell a user count from that user's single `last_seen`. */
  last_active_heatmap: number[][];
}

/** Population breakdowns. Faculty includes an explicit "no catalog /
 *  onboarding" bucket for users without `details.catalog`. */
export interface PopulationStats {
  by_faculty: CountBucket[];
  by_catalog: CountBucket[];
  by_catalog_year: CountBucket[];
  /** Feature adoption: dark mode, custom palette, timetable usage. */
  adoption: CountBucket[];
}

/** Onboarding funnel steps in order, with absolute counts at each step. */
export interface FunnelStats {
  signed_in: number;
  picked_catalog: number;
  imported_grades: number;
  computed_status: number;
}

/** One most-taken / hardest course row, names enriched from the course cache. */
export interface CourseStat {
  course_id: string;
  course_name: string;
  /** Number of students who took the course (most-taken). */
  count: number;
  /** Average numeric grade among graded takes, if any. */
  average_grade?: number;
  /** Fraction of takes that did not pass, in [0, 1]. */
  fail_rate?: number;
  /** Total `times_repeated` across students. */
  times_repeated?: number;
}

/** Requirement-bank completion (bottleneck banks). */
export interface BankCompletionStat {
  bank_name: string;
  /** Fraction of students who completed this bank, in [0, 1]. */
  completion_rate: number;
  completed: number;
  total: number;
}

/** Academic insights. */
export interface AcademicStats {
  /** Courses taken per academic semester, ordered by `semester.order_key`. */
  courses_per_semester: CountBucket[];
  most_taken_courses: CourseStat[];
  /** Per-student weighted-average GPA distribution, bucketed (e.g. by 5-pt bins). */
  gpa_distribution: CountBucket[];
  hardest_courses: CourseStat[];
  /** Highest-average courses (min graded-takers floor). */
  best_average_courses: CourseStat[];
  /** Lowest-average courses (min graded-takers floor). */
  worst_average_courses: CourseStat[];
  bank_completion: BankCompletionStat[];
}

export interface AdminStats {
  overview: OverviewStats;
  activity: ActivityStats;
  population: PopulationStats;
  funnel: FunnelStats;
  academic: AcademicStats;
  /** ISO-8601 timestamp of when the stats were computed (for the "updated" pill). */
  generated_at: string;
}
