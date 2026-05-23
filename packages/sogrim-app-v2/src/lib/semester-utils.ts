import type { AcademicSemester, SemesterSeason } from "@/types/api";

const SEASON_ORDER: Record<SemesterSeason, number> = {
  winter: 0,
  spring: 1,
  summer: 2,
};

const SEASON_HE: Record<SemesterSeason, string> = {
  winter: "חורף",
  spring: "אביב",
  summer: "קיץ",
};

export function semesterKey(semester: AcademicSemester): string {
  return `${semester.season}_${semester.start_year}`;
}

export function nullableSemesterKey(semester: AcademicSemester | null): string {
  return semester ? semesterKey(semester) : "null";
}

export function courseSemesterKey(courseId: string, semester: AcademicSemester | null): string {
  return `${courseId}__${nullableSemesterKey(semester)}`;
}

export function semestersEqual(a: AcademicSemester | null, b: AcademicSemester | null): boolean {
  if (a === null || b === null) return a === b;
  return a.season === b.season && a.start_year === b.start_year;
}

export function getAllSemesters(courseStatuses: Array<{ semester: AcademicSemester | null }>): AcademicSemester[] {
  const semesterMap = new Map<string, AcademicSemester>();
  for (const cs of courseStatuses) {
    if (cs.semester) {
      semesterMap.set(semesterKey(cs.semester), cs.semester);
    }
  }
  return Array.from(semesterMap.values()).sort((a, b) => parseSemesterOrder(a) - parseSemesterOrder(b));
}

export function parseSemesterOrder(semester: AcademicSemester): number {
  return semester.start_year * 3 + SEASON_ORDER[semester.season];
}

export function formatSemesterName(semester: AcademicSemester): string {
  return `${SEASON_HE[semester.season]} ${semester.start_year}-${semester.start_year + 1}`;
}

export function getCurrentAcademicStartYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed: 9 = October
  return month >= 9 ? year : year - 1;
}

export function createSemester(season: SemesterSeason, start_year = getCurrentAcademicStartYear()): AcademicSemester {
  return { season, start_year };
}

export function getNextSemesterName(
  allSemesters: AcademicSemester[],
  type: "Winter" | "Spring" | "Summer"
): AcademicSemester {
  const season: SemesterSeason = type === "Winter" ? "winter" : type === "Spring" ? "spring" : "summer";
  if (allSemesters.length === 0) {
    return createSemester(season);
  }

  const lastSemester = allSemesters[allSemesters.length - 1];
  const needsYearIncrement = season === "winter" && SEASON_ORDER[season] <= SEASON_ORDER[lastSemester.season];
  return {
    season,
    start_year: needsYearIncrement ? lastSemester.start_year + 1 : lastSemester.start_year,
  };
}

const SEASON_TO_CODE: Record<SemesterSeason, string> = {
  winter: "200",
  spring: "201",
  summer: "202",
};

export function plannerSemesterToApiId(semester: AcademicSemester): string {
  return `${semester.start_year}-${SEASON_TO_CODE[semester.season]}`;
}

export function parseSapSemesterId(value: string): AcademicSemester | null {
  const sapMatch = value.match(/^(\d{4})-(200|201|202)$/);
  if (!sapMatch) return null;
  const codeToSeason: Record<string, SemesterSeason> = { "200": "winter", "201": "spring", "202": "summer" };
  return { season: codeToSeason[sapMatch[2]], start_year: parseInt(sapMatch[1], 10) };
}
