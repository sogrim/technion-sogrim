import { useMemo } from "react";
import { CourseGrid } from "./course-grid";
import { PlannerCourseSearch } from "./planner-course-search";
import { SemesterFooter } from "./semester-footer";
import type { CourseStatus } from "@/types/api";
import type { RowData } from "@/types/domain";

interface SemesterPanelProps {
  semester: string | null;
  courseStatuses: CourseStatus[];
  bankNames: string[];
  onUpdateStatuses: (updatedStatuses: CourseStatus[]) => void;
  onDeleteCourse: (courseNumber: string) => void;
  onAddCourse: (row: RowData) => void;
}

export function SemesterPanel({
  semester,
  courseStatuses,
  bankNames,
  onUpdateStatuses,
  onDeleteCourse,
  onAddCourse,
}: SemesterPanelProps) {
  const semesterCourses = useMemo(
    () => courseStatuses.filter((cs) => cs.semester === semester),
    [courseStatuses, semester]
  );

  const existingRows: RowData[] = useMemo(
    () =>
      semesterCourses.map((cs) => ({
        name: cs.course.name,
        courseNumber: cs.course._id,
        credit: cs.course.credit,
        state: cs.state,
        type: cs.type,
        grade: cs.grade,
        semester: cs.semester,
      })),
    [semesterCourses]
  );

  return (
    <div className="space-y-0">
      <CourseGrid
        courseStatuses={courseStatuses}
        semester={semester}
        bankNames={bankNames}
        onUpdate={onUpdateStatuses}
        onDelete={onDeleteCourse}
      />

      {semester !== null && <SemesterFooter rows={existingRows} />}

      <div className="flex justify-center pt-4 pb-8">
        <PlannerCourseSearch
          semester={semester}
          existingRows={existingRows}
          bankNames={bankNames}
          onAdd={onAddCourse}
        />
      </div>
    </div>
  );
}
