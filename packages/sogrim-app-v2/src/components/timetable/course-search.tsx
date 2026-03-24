import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useTimetableStore } from "@/stores/timetable-store";
import { getProvider } from "@/data/course-schedule-provider";
import { LESSON_TYPE_NAMES, DAY_LABELS } from "@/lib/timetable-utils";
import type { CourseSchedule, Day } from "@/types/timetable";
import { Search, X, Plus, Clock, MapPin, SlidersHorizontal, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Filters {
  faculties: Set<string>;
  creditMin: number | null;
  creditMax: number | null;
  days: Set<Day>;
  hasExam: "all" | "with" | "without";
}

const EMPTY_FILTERS: Filters = {
  faculties: new Set(),
  creditMin: null,
  creditMax: null,
  days: new Set(),
  hasExam: "all",
};

function hasActiveFilters(f: Filters): boolean {
  return (
    f.faculties.size > 0 ||
    f.creditMin !== null ||
    f.creditMax !== null ||
    f.days.size > 0 ||
    f.hasExam !== "all"
  );
}

export function CourseSearch() {
  const searchOpen = useTimetableStore((s) => s.searchOpen);
  const setSearchOpen = useTimetableStore((s) => s.setSearchOpen);
  const addCourse = useTimetableStore((s) => s.addCourse);
  const drafts = useTimetableStore((s) => s.drafts);
  const activeDraftId = useTimetableStore((s) => s.activeDraftId);

  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, faculties: new Set(), days: new Set() });
  const inputRef = useRef<HTMLInputElement>(null);

  const draft = drafts.find((d) => d.id === activeDraftId);
  const selectedIds = new Set(draft?.courses.map((c) => c.courseId) ?? []);

  // Get all faculties for the filter dropdown
  const allFaculties = useMemo(() => {
    try {
      const courses = getProvider().getAllCourses();
      const facs = new Set<string>();
      for (const c of courses) {
        if (c.faculty) facs.add(c.faculty);
      }
      return Array.from(facs).sort();
    } catch {
      return [];
    }
  }, []);

  // Search + filter
  const results = useMemo(() => {
    try {
      const provider = getProvider();
      let courses: CourseSchedule[];

      if (query.trim()) {
        courses = provider.searchCourses(query);
      } else if (hasActiveFilters(filters)) {
        // Show filtered results even without text query
        courses = provider.getAllCourses();
      } else {
        return [];
      }

      // Apply filters
      return courses.filter((c) => {
        if (filters.faculties.size > 0 && c.faculty && !filters.faculties.has(c.faculty)) return false;
        if (filters.creditMin !== null && c.credit < filters.creditMin) return false;
        if (filters.creditMax !== null && c.credit > filters.creditMax) return false;
        if (filters.hasExam === "with" && !c.examA) return false;
        if (filters.hasExam === "without" && c.examA) return false;
        if (filters.days.size > 0) {
          const courseDays = new Set(c.groups.flatMap((g) => g.lessons.map((l) => l.day)));
          const hasMatchingDay = Array.from(filters.days).some((d) => courseDays.has(d));
          if (!hasMatchingDay) return false;
        }
        return true;
      }).slice(0, 80);
    } catch {
      return [];
    }
  }, [query, filters]);

  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setShowFilters(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen, setSearchOpen]);

  const toggleFaculty = useCallback((fac: string) => {
    setFilters((f) => {
      const next = new Set(f.faculties);
      if (next.has(fac)) next.delete(fac);
      else next.add(fac);
      return { ...f, faculties: next };
    });
  }, []);

  const toggleDay = useCallback((day: Day) => {
    setFilters((f) => {
      const next = new Set(f.days);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return { ...f, days: next };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...EMPTY_FILTERS, faculties: new Set(), days: new Set() });
  }, []);

  if (!searchOpen) return null;

  const filtersActive = hasActiveFilters(filters);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 animate-in fade-in-0 duration-150"
        onClick={() => setSearchOpen(false)}
      />

      <div
        className={cn(
          "fixed z-50 bg-card rounded-xl shadow-2xl border border-border overflow-hidden",
          "animate-in fade-in-0 zoom-in-95 duration-150",
          "inset-4 md:inset-auto",
          "md:top-[8%] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl md:max-h-[75vh]",
        )}
        dir="rtl"
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם קורס או מספר..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "relative p-1.5 rounded-md transition-colors",
              showFilters || filtersActive ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {filtersActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
          <button onClick={() => setSearchOpen(false)} className="p-1 rounded-md hover:bg-accent">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-border bg-secondary/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">סינון קורסים</span>
              {filtersActive && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  נקה הכל
                </button>
              )}
            </div>

            {/* Faculty filter */}
            <div className="space-y-1">
              <span className="text-[0.65rem] text-muted-foreground">פקולטה</span>
              <div className="flex flex-wrap gap-1">
                {allFaculties.map((fac) => (
                  <button
                    key={fac}
                    onClick={() => toggleFaculty(fac)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[0.6rem] font-medium transition-all",
                      filters.faculties.has(fac)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent",
                    )}
                  >
                    {fac.replace(/^הפקולטה ל/, "").replace(/^הפקולטה של /, "")}
                  </button>
                ))}
              </div>
            </div>

            {/* Credits filter */}
            <div className="flex items-center gap-3">
              <span className="text-[0.65rem] text-muted-foreground w-12">נק״ז</span>
              <div className="flex items-center gap-1">
                {[1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setFilters((f) => {
                        if (f.creditMin === c && f.creditMax === c) {
                          return { ...f, creditMin: null, creditMax: null };
                        }
                        return { ...f, creditMin: c, creditMax: c };
                      });
                    }}
                    className={cn(
                      "w-7 h-6 rounded text-[0.6rem] font-medium transition-all",
                      filters.creditMin === c && filters.creditMax === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Day filter */}
            <div className="flex items-center gap-3">
              <span className="text-[0.65rem] text-muted-foreground w-12">ימים</span>
              <div className="flex gap-1">
                {([0, 1, 2, 3, 4] as Day[]).map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "w-7 h-6 rounded text-[0.6rem] font-medium transition-all",
                      filters.days.has(day)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent",
                    )}
                  >
                    {DAY_LABELS[day]}
                  </button>
                ))}
              </div>
            </div>

            {/* Exam filter */}
            <div className="flex items-center gap-3">
              <span className="text-[0.65rem] text-muted-foreground w-12">מבחן</span>
              <div className="flex gap-1">
                {([
                  { value: "all", label: "הכל" },
                  { value: "with", label: "עם מבחן" },
                  { value: "without", label: "ללא מבחן" },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilters((f) => ({ ...f, hasExam: value }))}
                    className={cn(
                      "px-2 py-0.5 rounded text-[0.6rem] font-medium transition-all",
                      filters.hasExam === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="overflow-y-auto max-h-[calc(100vh-8rem)] md:max-h-[50vh]">
          {results.length > 0 && (
            <div className="px-4 py-1.5 text-[0.65rem] text-muted-foreground border-b border-border/50">
              {results.length} תוצאות
            </div>
          )}

          {(query.trim() || filtersActive) && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">לא נמצאו קורסים</p>
            </div>
          )}

          {!query.trim() && !filtersActive && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">הקלידו שם קורס או השתמשו בסינון</p>
            </div>
          )}

          {results.map((course) => (
            <CourseSearchResult
              key={course.id}
              course={course}
              isSelected={selectedIds.has(course.id)}
              onAdd={() => addCourse(course.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function CourseSearchResult({
  course,
  isSelected,
  onAdd,
}: {
  course: CourseSchedule;
  isSelected: boolean;
  onAdd: () => void;
}) {
  const scheduleSummary = useMemo(() => {
    const types = new Set(course.groups.map((g) => g.type));
    return Array.from(types)
      .map((t) => LESSON_TYPE_NAMES[t])
      .join(", ");
  }, [course]);

  const groupCount = course.groups.length;
  const firstLesson = course.groups[0]?.lessons[0];

  return (
    <button
      type="button"
      onClick={isSelected ? undefined : onAdd}
      disabled={isSelected}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 text-start",
        "hover:bg-accent/50 transition-colors cursor-pointer",
        isSelected && "opacity-50 cursor-not-allowed",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{course.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">{course.id}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          <span>{course.credit} נק״ז</span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {scheduleSummary}
          </span>
          {firstLesson?.building && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {firstLesson.building}
            </span>
          )}
          <span>{groupCount} קבוצות</span>
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 p-1.5 rounded-lg transition-colors",
          isSelected ? "text-muted-foreground" : "text-primary",
        )}
      >
        <Plus className="h-5 w-5" />
      </div>
    </button>
  );
}
