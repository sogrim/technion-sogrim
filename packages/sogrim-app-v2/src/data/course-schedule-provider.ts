import type { CourseSchedule, Semester } from "@/types/timetable";

/**
 * Facade for course schedule data.
 * POC uses StaticProvider; future swaps to ApiProvider.
 */
export interface CourseScheduleProvider {
  searchCourses(query: string): CourseSchedule[];
  getCourse(courseId: string): CourseSchedule | undefined;
  getAllCourses(): CourseSchedule[];
  getSemesters(): Semester[];
}

// Singleton provider instance
let _provider: CourseScheduleProvider | null = null;

export function setProvider(provider: CourseScheduleProvider) {
  _provider = provider;
}

export function getProvider(): CourseScheduleProvider {
  if (!_provider) {
    throw new Error("CourseScheduleProvider not initialized. Call setProvider() first.");
  }
  return _provider;
}
