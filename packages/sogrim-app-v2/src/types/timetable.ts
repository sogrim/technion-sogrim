/** Day of week: Sunday=0 through Friday=5 */
export type Day = 0 | 1 | 2 | 3 | 4 | 5;

export type LessonType = "lecture" | "tutorial" | "lab" | "seminar";

export interface Lesson {
  day: Day;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  building?: string;
  room?: string;
  instructor?: string;
}

export interface LessonGroup {
  id: string; // e.g. "11", "12"
  type: LessonType;
  /** Display name for sport groups (e.g. "נבחרת טניס נשים"). */
  displayName?: string;
  lessons: Lesson[];
}

export interface CourseSchedule {
  id: string; // Course number
  name: string; // Hebrew name
  credit: number;
  faculty?: string;
  examA?: string;
  examB?: string;
  groups: LessonGroup[];
  syllabus?: string; // Course description
  prerequisites?: string; // Prerequisite courses (Hebrew text, e.g. "234111 או 234114")
  linkedCourses?: string; // Related/linked courses
  noExtraCreditCourses?: string; // מקצועות ללא זיכוי נוסף
  lecturerInCharge?: string; // Head lecturer
  lectureHours?: number; // Weekly lecture hours
  tutorialHours?: number; // Weekly tutorial hours
  labHours?: number; // Weekly lab hours
  notes?: string; // Additional notes
  examATime?: string; // Full exam time "09:00 - 12:00"
  examBTime?: string; // Full exam time
}

export interface CourseSelection {
  courseId: string;
  selectedGroups: Partial<Record<LessonType, string>>; // type -> groupId
}

export interface CustomEvent {
  id: string;
  title: string;
  day: Day;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  color?: string; // optional custom color
}

export interface TimetableDraft {
  id: string;
  name: string; // "אפשרות א׳"
  semester: string; // "אביב_1"
  courses: CourseSelection[];
  customEvents: CustomEvent[];
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
}

/** Resolved event ready for rendering on the grid */
export interface TimetableEvent {
  courseId: string;
  courseName: string;
  type: LessonType;
  groupId: string;
  day: Day;
  startTime: string;
  endTime: string;
  building?: string;
  room?: string;
  instructor?: string;
  colorIndex: number;
  hasConflict: boolean;
  /** Ghost preview block — not the selected group, just showing alternatives */
  isPreview?: boolean;
  /** Custom user event (not a course) */
  isCustom?: boolean;
  customEventId?: string;
  customColor?: string;
}

export interface Semester {
  id: string;
  name: string;
  year: number;
  season: "fall" | "spring" | "summer";
}

export type ViewMode = "week" | "day";
