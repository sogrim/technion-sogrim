import type { CourseStatus } from "@/types/api";

export const RESERVED_PREFIX = "__RESERVED__";

/** Hardcoded פעילות חברתית courses that can be added to פטורים וזיכויים */
export const SOCIAL_ACTIVITY_COURSES = [
  { _id: "03200101", name: "פעילות חברתית 1", credit: 1 },
  { _id: "03200102", name: "פעילות חברתית 2", credit: 2 },
  { _id: "03200203", name: "פעילות חברתית 3", credit: 3 },
  { _id: "03200204", name: "פעילות חברתית 4", credit: 4 },
  { _id: "03200205", name: "פעילות חברתית 5", credit: 5 },
  { _id: "03200206", name: "פעילות חברתית 6", credit: 6 },
] as const;

export function isReservedCourse(cs: CourseStatus): boolean {
  return cs.course._id.startsWith(RESERVED_PREFIX);
}

export function getReservedCreditCourses(
  courseStatuses: CourseStatus[],
): CourseStatus[] {
  return courseStatuses.filter(
    (cs) => cs.course.name.includes("פעילות חברתית") && !isReservedCourse(cs),
  );
}

export function getTotalReservedCredits(
  courseStatuses: CourseStatus[],
): number {
  return getReservedCreditCourses(courseStatuses).reduce(
    (sum, cs) => sum + cs.course.credit,
    0,
  );
}

export function getAllocatedReservedCredits(
  courseStatuses: CourseStatus[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const cs of courseStatuses) {
    if (isReservedCourse(cs)) {
      map.set(cs.type!, cs.course.credit);
    }
  }
  return map;
}

export function getTotalAllocatedReservedCredits(
  courseStatuses: CourseStatus[],
): number {
  return courseStatuses
    .filter(isReservedCourse)
    .reduce((sum, cs) => sum + cs.course.credit, 0);
}

export function setReservedCredits(
  courseStatuses: CourseStatus[],
  bankName: string,
  credits: number,
): CourseStatus[] {
  const reservedId = `${RESERVED_PREFIX}${bankName}`;
  const result = courseStatuses.filter((cs) => cs.course._id !== reservedId);

  if (credits > 0) {
    result.push({
      course: {
        _id: reservedId,
        credit: credits,
        name: `זיכוי שמור - ${bankName}`,
      },
      state: "הושלם",
      type: bankName,
      grade: "פטור עם ניקוד",
      semester: null,
      modified: true,
      times_repeated: 0,
    });
  }

  return result;
}
