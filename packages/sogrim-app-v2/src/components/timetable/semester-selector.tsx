import { useTimetableStore } from "@/stores/timetable-store";
import { getProvider } from "@/data/course-schedule-provider";
import { switchProviderSemester } from "@/hooks/use-api-provider";
import { Dropdown } from "@/components/ui/dropdown";
import { parseSapSemesterId, plannerSemesterToApiId } from "@/lib/semester-utils";

export function SemesterSelector() {
  const currentSemester = useTimetableStore((s) => s.currentSemester);
  const setSemester = useTimetableStore((s) => s.setSemester);

  let semesters = getProvider().getSemesters();
  const currentValue = currentSemester ? plannerSemesterToApiId(currentSemester) : "";

  return (
    <Dropdown
      value={currentValue}
      onChange={(value) => {
        const semester = parseSapSemesterId(value);
        if (!semester) return;
        setSemester(semester);
        switchProviderSemester(value);
      }}
      options={semesters.map((sem) => ({
        value: sem.id,
        label: sem.name,
      }))}
      className="w-48"
    />
  );
}
