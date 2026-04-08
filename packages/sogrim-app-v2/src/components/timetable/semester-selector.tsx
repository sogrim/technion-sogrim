import { useTimetableStore } from "@/stores/timetable-store";
import { getProvider } from "@/data/course-schedule-provider";
import { switchProviderSemester } from "@/hooks/use-api-provider";
import { Dropdown } from "@/components/ui/dropdown";

export function SemesterSelector() {
  const currentSemester = useTimetableStore((s) => s.currentSemester);
  const setSemester = useTimetableStore((s) => s.setSemester);

  let semesters = getProvider().getSemesters();

  return (
    <Dropdown
      value={currentSemester}
      onChange={(value) => {
        setSemester(value);
        switchProviderSemester(value);
      }}
      options={semesters.map((sem) => ({
        value: sem.id,
        label: sem.name,
      }))}
      className="w-40"
    />
  );
}
