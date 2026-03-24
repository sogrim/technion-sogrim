import type { CourseSchedule, Semester } from "@/types/timetable";
import type { CourseScheduleProvider } from "./course-schedule-provider";

export class StaticProvider implements CourseScheduleProvider {
  private courses: CourseSchedule[];
  private courseMap: Map<string, CourseSchedule>;
  private semesters: Semester[];

  constructor(courses: CourseSchedule[], semesters: Semester[]) {
    this.courses = courses;
    this.courseMap = new Map(courses.map((c) => [c.id, c]));
    this.semesters = semesters;
  }

  searchCourses(query: string): CourseSchedule[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return this.courses.filter(
      (c) =>
        c.id.includes(q) ||
        c.name.includes(q) ||
        c.faculty?.includes(q),
    ).slice(0, 50);
  }

  getCourse(courseId: string): CourseSchedule | undefined {
    return this.courseMap.get(courseId);
  }

  getAllCourses(): CourseSchedule[] {
    return this.courses;
  }

  getSemesters(): Semester[] {
    return this.semesters;
  }
}
