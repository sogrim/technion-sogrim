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
