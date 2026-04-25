import { useState } from "react";
import { CourseSearch } from "@/components/common/course-search";
import { courseFromUserValidations } from "@/lib/course-validator";
import { COURSE_GRADE_OPTIONS } from "@/types/domain";
import type { CourseSchedule } from "@/types/timetable";
import type { RowData } from "@/types/domain";
import { Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Toast } from "@/components/ui/toast";
import { useIsOgPalette } from "@/stores/ui-store";

interface PlannerCourseSearchProps {
  semester: string | null;
  existingRows: RowData[];
  bankNames: string[];
  onAdd: (row: RowData) => void;
}

export function PlannerCourseSearch({
  semester,
  existingRows,
  bankNames,
  onAdd,
}: PlannerCourseSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseSchedule | null>(null);
  const isOg = useIsOgPalette();

  // Detail form state
  const [credit, setCredit] = useState("");
  const [grade, setGrade] = useState("");
  const [gradeIsNumeric, setGradeIsNumeric] = useState(true);
  const [type, setType] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "error" } | null>(null);

  const isSemester0 = semester === null;

  function handleCourseSelected(course: CourseSchedule) {
    setSelectedCourse(course);
    setCredit(String(course.credit));
    setGrade("");
    setGradeIsNumeric(true);
    setType("");
  }

  function resetForm() {
    setSelectedCourse(null);
    setCredit("");
    setGrade("");
    setGradeIsNumeric(true);
    setType("");
  }

  function handleSubmit() {
    if (!selectedCourse) return;

    const row: RowData = {
      name: selectedCourse.name,
      courseNumber: selectedCourse.id,
      credit: credit || "0",
      grade: grade || undefined,
      state: "",
      type: type || undefined,
      semester,
    };

    const result = courseFromUserValidations(row, existingRows, true);

    if (result.error) {
      setToast({ message: result.msg, type: "error" });
      return;
    }

    onAdd(result.newRowData);
    setToast(null);
    resetForm();
  }

  // State: no course selected yet, show the "add" button or search modal
  if (!selectedCourse) {
    return (
      <>
        <Button
          variant={isOg ? "outline" : undefined}
          size="sm"
          onClick={() => setSearchOpen(true)}
          className={
            isOg
              ? "border-foreground/30 text-foreground hover:bg-foreground hover:text-background"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          }
        >
          <Plus className="h-4 w-4" />
          הוסף קורס חדש
        </Button>

        <CourseSearch
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelect={handleCourseSelected}
          selectedIds={new Set<string>()}
          toggleMode={false}
        />

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  // State: course selected, show inline detail form
  return (
    <div className="w-full max-w-5xl">
      <div className="flex items-end gap-1.5 flex-wrap rounded-lg border bg-muted/50 p-3">
        {/* Course name (read-only) */}
        <div className="flex-[2] min-w-[160px]">
          <label className="text-[11px] text-muted-foreground mb-0.5 block">
            שם הקורס
          </label>
          <div className="w-full h-8 rounded border border-border bg-card px-2 text-sm flex items-center gap-2">
            <span className="truncate">{selectedCourse.name}</span>
            <span className="text-muted-foreground text-xs shrink-0">{selectedCourse.id}</span>
          </div>
        </div>

        {/* Credits (pre-filled, editable) */}
        <div className="min-w-[60px] w-[70px]">
          <label className="text-[11px] text-muted-foreground mb-0.5 block">
            נק״ז
          </label>
          <input
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
            placeholder="3"
            type="number"
            step="0.5"
            min="0"
            className="w-full h-8 rounded border border-border bg-card px-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-foreground/30"
          />
        </div>

        {/* Grade */}
        <div className="min-w-[100px] w-[120px]">
          <label className="text-[11px] text-muted-foreground mb-0.5 block">
            ציון
          </label>
          {isSemester0 ? (
            <Dropdown
              value={grade}
              onChange={setGrade}
              options={COURSE_GRADE_OPTIONS.filter((opt) =>
                opt.includes("פטור")
              ).map((opt) => ({ value: opt, label: opt }))}
            />
          ) : gradeIsNumeric ? (
            <div className="space-y-0.5">
              <input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="0-100"
                type="number"
                min="0"
                max="100"
                className="w-full h-8 rounded border border-border bg-card px-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-foreground/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => { setGradeIsNumeric(false); setGrade(""); }}
                className="text-[10px] text-info hover:underline"
              >
                ציון לא מספרי
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              <Dropdown
                value={grade}
                onChange={setGrade}
                options={COURSE_GRADE_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
              />
              <button
                type="button"
                onClick={() => { setGradeIsNumeric(true); setGrade(""); }}
                className="text-[10px] text-info hover:underline"
              >
                ציון מספרי
              </button>
            </div>
          )}
        </div>

        {/* Category */}
        {!isSemester0 && (
          <div className="min-w-[120px] flex-1">
            <label className="text-[11px] text-muted-foreground mb-0.5 block">
              קטגוריה
            </label>
            <Dropdown
              value={type}
              onChange={setType}
              options={bankNames.map((name) => ({ value: name, label: name }))}
              placeholder="--"
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleSubmit}
            className="flex items-center justify-center h-8 w-8 rounded-full bg-foreground text-background hover:bg-foreground/80 transition-colors"
            title="אישור"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={resetForm}
            className="flex items-center justify-center h-8 w-8 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            title="ביטול"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
