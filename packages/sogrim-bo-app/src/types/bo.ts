/**
 * Types mirroring the JSON the server emits for back-office reads. They are
 * intentionally permissive — the raw document is always available via the JSON
 * view, so unknown/extra fields are fine.
 */

export type Faculty =
  | "Unknown"
  | "ComputerScience"
  | "DataAndDecisionScience"
  | "ElectricalEngineering"
  | "Medicine";

export type Permissions = "Student" | "Admin" | "Owner";

/** bson ObjectId as serialized by serde_json. */
export interface Oid {
  $oid: string;
}

/** bson DateTime as serialized by serde_json (canonical extended JSON). */
export interface BsonDate {
  $date: string | number | { $numberLong: string };
}

export interface CourseBank {
  name: string;
  /** Polymorphic rule: "All" | "Elective" | { AccumulateCourses: ... } | { Chains: ... } | ... */
  rule: unknown;
  credit: number | null;
}

export interface CreditOverflow {
  from: string;
  to: string;
}

export interface Catalog {
  _id: Oid;
  name: string;
  faculty: Faculty;
  total_credit: number;
  description: string;
  course_banks: CourseBank[];
  credit_overflows: CreditOverflow[];
  course_to_bank: Record<string, string>;
  catalog_replacements: Record<string, string[]>;
  common_replacements: Record<string, string[]>;
}

export interface Course {
  _id: string;
  credit: number;
  name: string;
  tags?: string[] | null;
}

/** Lightweight projection returned by the users list (avoids shipping all PII). */
export interface UserSummary {
  sub: string;
  permissions: Permissions;
  catalog_name: string | null;
  total_credit: number;
  num_courses: number;
  last_seen?: BsonDate | null;
}

/** Full user document returned by the user detail endpoint. */
export interface User {
  _id: string;
  permissions: Permissions;
  details: unknown;
  settings: unknown;
  timetable?: unknown;
  last_seen?: BsonDate | null;
}

/** Any document rendered by the generic list/detail views. */
export type ResourceRecord = Record<string, unknown>;
