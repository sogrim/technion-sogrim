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

export function parseSemesterOrder(semester: string): number {
  const parts = semester.split("_");
  if (parts.length < 2) return 0;
  const num = parseInt(parts[1], 10);
  const name = parts[0];
  // Order: חורף (winter) first, then אביב (spring), then קיץ (summer)
  const seasonOrder = name === "חורף" ? 0 : name === "אביב" ? 1 : 2;
  return num * 10 + seasonOrder;
}

export function formatSemesterName(semester: string): string {
  const name = semester.replace("_", " ");
  const parts = name.split(" ");
  if (parts[0] === "קיץ") return parts[0];
  return name;
}

export function getNextSemesterName(
  allSemesters: string[],
  type: "Winter" | "Spring" | "Summer"
): string {
  if (allSemesters.length === 0) {
    return type === "Winter" ? "חורף_1" : "אביב_1";
  }

  const lastNonSummer = [...allSemesters].reverse().find((s) => !s.includes("קיץ"));
  const lastSemester = lastNonSummer || allSemesters[allSemesters.length - 1];

  const parts = lastSemester.split("_");
  const num = parseInt(parts[1], 10) || 0;

  if (type === "Summer") return `קיץ_${num}`;

  const newName = lastSemester.includes("חורף") ? "אביב" : "חורף";
  return `${newName}_${num + 1}`;
}
