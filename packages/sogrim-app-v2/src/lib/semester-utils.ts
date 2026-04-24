export function getAllSemesters(courseStatuses: Array<{ semester: string | null }>): string[] {
  const semesterSet = new Set<string>();
  for (const cs of courseStatuses) {
    if (cs.semester) {
      semesterSet.add(cs.semester);
    }
  }
  return Array.from(semesterSet).sort((a, b) => {
    const aNum = parseSemesterOrder(a);
    const bNum = parseSemesterOrder(b);
    return aNum - bNum;
  });
}

const SEASON_ORDER: Record<string, number> = {
  "חורף": 0,
  "אביב": 1,
  "קיץ": 2,
};

/**
 * Returns a sort key for a semester string.
 * Supports both new format "season_YYYY-YYYY" and legacy format "season_N".
 */
export function parseSemesterOrder(semester: string): number {
  const parts = semester.split("_");
  if (parts.length < 2) return 0;
  const season = parts[0];
  const rest = parts[1];
  const seasonOrder = SEASON_ORDER[season] ?? 3;

  // New format: "חורף_2020-2021"
  const yearMatch = rest.match(/^(\d{4})-(\d{4})$/);
  if (yearMatch) {
    const startYear = parseInt(yearMatch[1], 10);
    return startYear * 10 + seasonOrder;
  }

  // Legacy format: "חורף_1" or "קיץ_2.5"
  const num = parseFloat(rest);
  if (!isNaN(num)) {
    return num * 10 + seasonOrder;
  }

  return 0;
}

export function formatSemesterName(semester: string): string {
  const name = semester.replace("_", " ");
  const parts = name.split(" ");
  if (parts[0] === "קיץ") return parts[0];
  return name;
}

/**
 * Returns the current Technion academic year range (e.g., "2024-2025").
 * Academic year starts in October.
 */
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed: 9 = October
  if (month >= 9) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

/**
 * Increments a "YYYY-YYYY" year range by one academic year.
 */
function incrementYearRange(yearRange: string): string {
  const match = yearRange.match(/^(\d{4})-(\d{4})$/);
  if (!match) return yearRange;
  const start = parseInt(match[1], 10) + 1;
  return `${start}-${start + 1}`;
}

/**
 * Checks whether a semester string uses the new year-based format.
 */
function isYearFormat(semester: string): boolean {
  return /^.+_\d{4}-\d{4}$/.test(semester);
}

export function getNextSemesterName(
  allSemesters: string[],
  type: "Winter" | "Spring" | "Summer"
): string {
  const hebrewType = type === "Winter" ? "חורף" : type === "Spring" ? "אביב" : "קיץ";
  const academicYear = getCurrentAcademicYear();

  if (allSemesters.length === 0) {
    return `${hebrewType}_${academicYear}`;
  }

  const lastSemester = allSemesters[allSemesters.length - 1];

  // New year-based format
  if (isYearFormat(lastSemester)) {
    const parts = lastSemester.split("_");
    const lastSeason = parts[0];
    const lastYear = parts[1];

    // Increment year when adding חורף after אביב or קיץ (new academic year)
    const lastSeasonOrder = SEASON_ORDER[lastSeason] ?? 0;
    const newSeasonOrder = SEASON_ORDER[hebrewType] ?? 0;
    const needsYearIncrement = newSeasonOrder <= lastSeasonOrder && hebrewType === "חורף";
    const yearRange = needsYearIncrement ? incrementYearRange(lastYear) : lastYear;

    return `${hebrewType}_${yearRange}`;
  }

  // Legacy format fallback
  const lastNonSummer = [...allSemesters].reverse().find((s) => !s.includes("קיץ"));
  const fallbackSemester = lastNonSummer || lastSemester;
  const parts = fallbackSemester.split("_");
  const num = parseInt(parts[1], 10) || 0;

  if (type === "Summer") return `קיץ_${num}`;

  const newName = fallbackSemester.includes("חורף") ? "אביב" : "חורף";
  return `${newName}_${num + 1}`;
}
