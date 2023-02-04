export type Catalog = {
  name: string;
  total_credit: number;
  description: string;
  _id: {
    $oid: string;
  };
  course_bank_names: string[];
};

export type Course = {
  credit: number;
  name: string;
  _id: string;
};

export type CourseState = "הושלם" | "לא הושלם" | "לא רלוונטי" | "בתהליך";
export type CourseGradeOptions =
  | "עבר"
  | "נכשל"
  | "פטור ללא ניקוד"
  | "פטור עם ניקוד"
  | "לא השלים";

export type CourseStatus = {
  course: Course;
  grade?: string;
  semester: string | null;
  state: CourseState;
  type?: string;
  modified: boolean;
  specialization_group_name?: string;
  additional_msg?: string;
};

export const ACCUMULATE_COURSES = "accumulate courses";
export const SPECIALIZATION_GROUPS = "specialization groups";
export const ALL = "all";

export type CourseBankReq = {
  bank_rule_name: string;
  course_bank_name: string;
  credit_completed: number;
  credit_requirement: number;
  course_completed: number;
  course_requirement: number;
  message?: string;
  completed?: boolean;
  type: string;
};

export type DegreeStatus = {
  course_bank_requirements: CourseBankReq[];
  course_statuses: CourseStatus[];
  overflow_msgs: string[];
  total_credit: number;
};

export type UserSettings = {
  dark_mode: boolean;
};

export type UserDetails = {
  degree_status: DegreeStatus;
  catalog?: Catalog;
  compute_in_progress: boolean;
  modified: boolean;
};

export type UserState = {
  _id: string;
  details: UserDetails;
  settings: UserSettings;
};
