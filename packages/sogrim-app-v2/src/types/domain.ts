import type { CourseGradeOptions } from "./api";

export interface RowData {
  name: string;
  courseNumber: string;
  credit: string | number;
  state: string;
  type?: string;
  grade?: string;
  semester: string | null;
  sg_name?: string;
  msg?: string;
}

export const COURSE_STATE_OPTIONS = ["הושלם", "לא הושלם", "לא רלוונטי", "בתהליך"] as const;

export const COURSE_GRADE_OPTIONS: CourseGradeOptions[] = [
  "עבר",
  "נכשל",
  "פטור ללא ניקוד",
  "פטור עם ניקוד",
  "לא השלים",
];

export const UserRegistrationState = {
  NoCatalog: 0,
  NoCourses: 1,
  NoComputeValue: 2,
  Ready: 3,
  Loading: 9,
} as const;
export type UserRegistrationState = (typeof UserRegistrationState)[keyof typeof UserRegistrationState];

export const SemesterOption = {
  Winter: "Winter",
  Spring: "Spring",
  Summer: "Summer",
} as const;
export type SemesterOption = (typeof SemesterOption)[keyof typeof SemesterOption];
