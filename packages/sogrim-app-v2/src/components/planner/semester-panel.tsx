import { useMemo } from "react";
import { BookOpen } from "lucide-react";
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

  const isEmpty = semester !== null && semesterCourses.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full bg-foreground/5 blur-xl" aria-hidden />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-border/60 bg-card">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-base font-medium text-foreground mb-1.5">
          אין קורסים בסמסטר זה
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          הוסיפו קורסים שלמדתם או שאתם מתכננים ללמוד כדי לעקוב אחר ההתקדמות
          שלכם
        </p>
        <PlannerCourseSearch
          semester={semester}
          existingRows={existingRows}
          bankNames={bankNames}
          onAdd={onAddCourse}
        />
      </div>
    );
  }

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
