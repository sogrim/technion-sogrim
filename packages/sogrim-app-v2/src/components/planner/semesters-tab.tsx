import { useMemo } from "react";
import { Snowflake, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllSemesters, parseSemesterOrder, getCurrentAcademicYear } from "@/lib/semester-utils";
import { SemesterPanel } from "./semester-panel";
import { SemesterTimeline } from "./semester-timeline";
import type { CourseStatus } from "@/types/api";
import type { RowData } from "@/types/domain";


interface SemestersTabProps {
  courseStatuses: CourseStatus[];
  bankNames: string[];
  currentSemesterIdx: number;
  extraSemesters?: string[];
  onSelectSemester: (idx: number) => void;
  onAddSemester: (semesterName: string, renames?: Record<string, string>) => void;
  onDeleteSemester: (semesterName: string, renames?: Record<string, string>) => void;
  onUpdateStatuses: (updatedStatuses: CourseStatus[]) => void;
  onDeleteCourse: (courseNumber: string) => void;
  onAddCourse: (row: RowData) => void;
}

function EmptyState({
  onAddSemester,
}: {
  onAddSemester: (semesterName: string, renames?: Record<string, string>) => void;
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
          onClick={() => onAddSemester(`חורף_${getCurrentAcademicYear()}`)}
        >
          <Snowflake className="h-5 w-5" />
          {"חורף"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="px-8 py-4 text-base border-foreground text-foreground hover:bg-foreground hover:text-background gap-2"
          onClick={() => onAddSemester(`אביב_${getCurrentAcademicYear()}`)}
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
  onSelectSemester,
  onAddSemester,
  onDeleteSemester,
  onUpdateStatuses,
  onDeleteCourse,
  onAddCourse,
}: SemestersTabProps) {
  const courseSemesters = getAllSemesters(courseStatuses);
  // Merge course-based semesters with extra (empty) semesters from parent
  const tabs = useMemo(() => {
    const merged = new Set([...courseSemesters, ...extraSemesters]);
    return Array.from(merged).sort((a, b) => {
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
        onSelectOrdinal={onSelectSemester}
        onAddSemester={onAddSemester}
        onDeleteSemester={onDeleteSemester}
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
