import { useMemo } from "react";
import { Snowflake, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSemester, getAllSemesters, parseSemesterOrder, semesterKey } from "@/lib/semester-utils";
import { SemesterPanel } from "./semester-panel";
import { SemesterTimeline } from "./semester-timeline";
import type { AcademicSemester, CourseStatus } from "@/types/api";
import type { RowData } from "@/types/domain";


interface SemestersTabProps {
  courseStatuses: CourseStatus[];
  bankNames: string[];
  currentSemesterIdx: number;
  extraSemesters?: AcademicSemester[];
  annotations: Record<string, string>;
  onSelectSemester: (idx: number) => void;
  onAddSemester: (semesterName: AcademicSemester) => void;
  onDeleteSemester: (semesterName: AcademicSemester) => void;
  onShiftSemestersFrom: (fromOrdinalIdx: number, deltaYears: number) => void;
  onSetAnnotations: (next: Record<string, string>) => void;
  onUpdateStatuses: (updatedStatuses: CourseStatus[]) => void;
  onDeleteCourse: (courseNumber: string, semester: AcademicSemester | null) => void;
  onAddCourse: (row: RowData) => void;
}

function EmptyState({
  onAddSemester,
}: {
  onAddSemester: (semesterName: AcademicSemester) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h3 className="text-xl font-medium text-foreground mb-6">
        {"באיזה סמסטר התחלתם את התואר? חורף או אביב?"}
      </h3>
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          className="px-8 py-4 text-base border-foreground text-foreground hover:bg-foreground hover:text-background gap-2"
          onClick={() => onAddSemester(createSemester("winter"))}
        >
          <Snowflake className="h-5 w-5" />
          {"חורף"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="px-8 py-4 text-base border-foreground text-foreground hover:bg-foreground hover:text-background gap-2"
          onClick={() => onAddSemester(createSemester("spring"))}
        >
          <Sun className="h-5 w-5" />
          {"אביב"}
        </Button>
      </div>
    </div>
  );
}

export function SemestersTab({
  courseStatuses,
  bankNames,
  currentSemesterIdx,
  extraSemesters = [],
  annotations,
  onSelectSemester,
  onAddSemester,
  onDeleteSemester,
  onShiftSemestersFrom,
  onSetAnnotations,
  onUpdateStatuses,
  onDeleteCourse,
  onAddCourse,
}: SemestersTabProps) {
  const courseSemesters = getAllSemesters(courseStatuses);
  // Merge course-based semesters with extra (empty) semesters from parent
  const tabs = useMemo(() => {
    const merged = new Map([...courseSemesters, ...extraSemesters].map((s) => [semesterKey(s), s]));
    return Array.from(merged.values()).sort((a, b) => {
      const aNum = parseSemesterOrder(a);
      const bNum = parseSemesterOrder(b);
      return aNum - bNum;
    });
  }, [courseSemesters, extraSemesters]);
  const currentSemester = tabs[currentSemesterIdx] ?? null;

  // Empty state - no semesters at all
  if (tabs.length === 0) {
    return <EmptyState onAddSemester={onAddSemester} />;
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Interactive calendar timeline with integrated add/delete affordances */}
      <SemesterTimeline
        ordinals={tabs}
        currentOrdinalIdx={currentSemesterIdx}
        annotations={annotations}
        onSelectOrdinal={onSelectSemester}
        onAddSemester={onAddSemester}
        onDeleteSemester={onDeleteSemester}
        onShiftSemestersFrom={onShiftSemestersFrom}
        onSetAnnotations={onSetAnnotations}
      />

      {/* Course grid for selected semester */}
      <SemesterPanel
        semester={currentSemester}
        courseStatuses={courseStatuses}
        bankNames={bankNames}
        onUpdateStatuses={onUpdateStatuses}
        onDeleteCourse={onDeleteCourse}
        onAddCourse={onAddCourse}
      />
    </div>
  );
}
