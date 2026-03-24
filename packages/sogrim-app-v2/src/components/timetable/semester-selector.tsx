import { useTimetableStore } from "@/stores/timetable-store";
import { getProvider } from "@/data/course-schedule-provider";
import { cn } from "@/lib/utils";

export function SemesterSelector() {
  const currentSemester = useTimetableStore((s) => s.currentSemester);
  const setSemester = useTimetableStore((s) => s.setSemester);

  let semesters: { id: string; name: string }[] = [];
  try {
    semesters = getProvider().getSemesters();
  } catch {
    semesters = [{ id: "spring-2026", name: "אביב 2026" }];
  }

  return (
    <select
      value={currentSemester}
      onChange={(e) => setSemester(e.target.value)}
      className={cn(
        "bg-secondary text-foreground rounded-lg px-3 py-1.5 text-sm font-medium",
        "border border-border cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
      )}
      dir="rtl"
    >
      {semesters.map((sem) => (
        <option key={sem.id} value={sem.id}>
          {sem.name}
        </option>
      ))}
    </select>
  );
}
