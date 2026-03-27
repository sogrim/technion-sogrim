import type { CourseStatus } from "@/types/api";

export function exportCoursesToCsv(courseStatuses: CourseStatus[]): void {
  const BOM = "\uFEFF";
  const headers = ["מספר קורס", "שם קורס", "נקודות זכות", "סמסטר", "ציון", "סטטוס", "סוג"];
  const rows = courseStatuses.map((cs) => [
    cs.course._id,
    cs.course.name,
    String(cs.course.credit),
    cs.semester ?? "",
    cs.grade ?? "",
    cs.state,
    cs.type ?? "",
  ]);

  const csvContent =
    BOM +
    [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sogrim-courses.csv";
  link.click();
  URL.revokeObjectURL(url);
}
