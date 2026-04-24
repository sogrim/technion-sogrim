import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { useCoursesFilter } from "@/hooks/use-courses-filter";
import { courseFromUserValidations } from "@/lib/course-validator";
import { COURSE_GRADE_OPTIONS } from "@/types/domain";
import type { RowData } from "@/types/domain";
import type { Course } from "@/types/api";

interface AddCourseFormProps {
  semester: string | null;
  existingRows: RowData[];
  bankNames: string[];
  onAdd: (row: RowData) => void;
}

export function AddCourseForm({
  semester,
  existingRows,
  bankNames,
  onAdd,
}: AddCourseFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [courseNumber, setCourseNumber] = useState("");
  const [courseName, setCourseName] = useState("");
  const [credit, setCredit] = useState("");
  const [grade, setGrade] = useState("");
  const [gradeIsNumeric, setGradeIsNumeric] = useState(true);
  const [type, setType] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [numberSearchTerm, setNumberSearchTerm] = useState("");
  const [debouncedNumberSearch, setDebouncedNumberSearch] = useState("");
  const [showNumberSuggestions, setShowNumberSuggestions] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error";
  } | null>(null);

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const numberSuggestionsRef = useRef<HTMLDivElement>(null);

  const { data: courses } = useCoursesFilter("name", debouncedSearch);
  const { data: numberCourses } = useCoursesFilter(
    "number",
    debouncedNumberSearch,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNumberSearch(numberSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [numberSearchTerm]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        numberSuggestionsRef.current &&
        !numberSuggestionsRef.current.contains(e.target as Node)
      ) {
        setShowNumberSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCourse = useCallback((course: Course) => {
    setCourseNumber(course._id);
    setCourseName(course.name);
    setCredit(String(course.credit));
    setSearchTerm(course.name);
    setNumberSearchTerm(course._id);
    setShowSuggestions(false);
    setShowNumberSuggestions(false);
  }, []);

  function resetForm() {
    setSearchTerm("");
    setNumberSearchTerm("");
    setCourseNumber("");
    setCourseName("");
    setCredit("");
    setGrade("");
    setGradeIsNumeric(true);
    setType("");
  }

  function handleSubmit() {
    const name = courseName || searchTerm;
    if (!name.trim() || !courseNumber.trim() || !credit.trim()) {
      setToast({
        message: "יש למלא שם קורס, מספר קורס ונקודות זכות",
        type: "error",
      });
      return;
    }

    const row: RowData = {
      name,
      courseNumber,
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
    resetForm();
    setExpanded(false);
  }

  const isSemester0 = semester === null;

  if (!expanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => { setToast(null); setExpanded(true); }}
        className="border-foreground/30 text-foreground hover:bg-foreground hover:text-background"
      >
        <Plus className="h-4 w-4" />
        הוסף קורס חדש
      </Button>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      {/* Compact inline row form */}
      <div className="flex items-end gap-1.5 flex-wrap rounded-lg border bg-muted/50 p-3">
        {/* Course name with autocomplete */}
        <div className="relative flex-[1.2] min-w-[110px]">
          <label className="text-[11px] text-muted-foreground mb-0.5 block">
            שם הקורס<span className="text-red-500 ms-0.5">*</span>
          </label>
          <div className="relative">
            <Search className="absolute start-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="חיפוש..."
              className="w-full h-8 rounded border border-border bg-card ps-7 pe-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
            />
          </div>
          {showSuggestions && courses && courses.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-20 top-full start-0 end-0 mt-1 max-h-48 overflow-y-auto rounded-md border bg-card shadow-lg"
            >
              {courses.map((course) => (
                <button
                  key={course._id}
                  onClick={() => handleSelectCourse(course)}
                  className="block w-full px-3 py-2 text-start text-sm hover:bg-muted transition-colors"
                >
                  <span className="font-medium">{course._id}</span>
                  <span className="text-muted-foreground ms-1">
                    - {course.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Course number */}
        <div
          className="min-w-[80px] flex-1 relative"
          ref={numberSuggestionsRef}
        >
          <label className="text-[11px] text-muted-foreground mb-0.5 block">
            מס׳ הקורס<span className="text-red-500 ms-0.5">*</span>
          </label>
          <input
            value={courseNumber}
            onChange={(e) => {
              setCourseNumber(e.target.value);
              setNumberSearchTerm(e.target.value);
              setShowNumberSuggestions(true);
            }}
            onFocus={() =>
              numberCourses?.length && setShowNumberSuggestions(true)
            }
            placeholder="12345678"
            dir="ltr"
            className="w-full h-8 rounded border border-border bg-card px-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-foreground/30"
          />
          {showNumberSuggestions &&
            numberCourses &&
            numberCourses.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-lg">
                {numberCourses.map((course) => (
                  <button
                    key={course._id}
                    onClick={() => handleSelectCourse(course)}
                    className="block w-full px-3 py-2 text-start text-sm hover:bg-muted transition-colors"
                  >
                    <span className="font-medium">{course._id}</span>
                    <span className="text-muted-foreground ms-1">
                      - {course.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
        </div>

        {/* Credits */}
        <div className="min-w-[60px] w-[70px]">
          <label className="text-[11px] text-muted-foreground mb-0.5 block">
            נק״ז<span className="text-red-500 ms-0.5">*</span>
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
        <div className="min-w-[140px] w-[180px]">
          <label className="text-[11px] text-muted-foreground mb-0.5 block">
            ציון
          </label>
          {isSemester0 ? (
            <Dropdown
              value={grade}
              onChange={setGrade}
              options={COURSE_GRADE_OPTIONS.filter((opt) =>
                opt.includes("פטור"),
              ).map((opt) => ({ value: opt, label: opt }))}
            />
          ) : gradeIsNumeric ? (
            <div className="flex items-center gap-1">
              <input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="0-100"
                type="number"
                min="0"
                max="100"
                className="flex-1 h-8 rounded border border-border bg-card px-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-foreground/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => {
                  setGradeIsNumeric(false);
                  setGrade("");
                }}
                className="text-[10px] text-blue-500 hover:underline whitespace-nowrap"
              >
                ציון לא מספרי
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <div className="flex-1">
                <Dropdown
                  value={grade}
                  onChange={setGrade}
                  options={COURSE_GRADE_OPTIONS.map((opt) => ({
                    value: opt,
                    label: opt,
                  }))}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setGradeIsNumeric(true);
                  setGrade("");
                }}
                className="text-[10px] text-blue-500 hover:underline whitespace-nowrap"
              >
                ציון מספרי
              </button>
            </div>
          )}
        </div>

        {/* Category */}
        {!isSemester0 && (
          <div className="min-w-[120px] w-[160px]">
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
            title="הוסף"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              resetForm();
              setToast(null);
              setExpanded(false);
            }}
            className="flex items-center justify-center h-8 w-8 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            title="ביטול"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 px-2 py-1 text-sm text-red-600">
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-red-400 hover:text-red-600 text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
