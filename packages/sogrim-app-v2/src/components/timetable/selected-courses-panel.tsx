import { useMemo } from "react";
import { useTimetableStore } from "@/stores/timetable-store";
import { getProvider } from "@/data/course-schedule-provider";
import { getCourseColor } from "@/lib/timetable-colors";
import { useUiStore } from "@/stores/ui-store";
import { GroupSelector } from "./group-selector";
import { Trash2, BookOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SelectedCoursesPanel() {
  const drafts = useTimetableStore((s) => s.drafts);
  const activeDraftId = useTimetableStore((s) => s.activeDraftId);
  const removeCourse = useTimetableStore((s) => s.removeCourse);
  const setSearchOpen = useTimetableStore((s) => s.setSearchOpen);
  const setDetailCourse = useTimetableStore((s) => s.setDetailCourse);
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  const draft = drafts.find((d) => d.id === activeDraftId);

  const coursesWithData = useMemo(() => {
    if (!draft) return [];
    const provider = getProvider();
    return draft.courses.map((sel, index) => ({
      selection: sel,
      course: provider.getCourse(sel.courseId),
      colorIndex: index,
    }));
  }, [draft]);

  const totalCredits = coursesWithData.reduce(
    (sum, c) => sum + (c.course?.credit ?? 0),
    0,
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span>{coursesWithData.length} קורסים</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">{totalCredits} נק״ז</span>
        </div>
      </div>

      {coursesWithData.length === 0 ? (
        <button
          onClick={() => setSearchOpen(true)}
          className={cn(
            "w-full flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-dashed border-border",
            "text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer",
          )}
        >
          <Search className="h-5 w-5" />
          <span className="text-sm">חפשו והוסיפו קורסים</span>
        </button>
      ) : (
        <div className="space-y-1.5">
          {coursesWithData.map(({ selection, course, colorIndex }) => {
            if (!course) return null;
            const color = getCourseColor(colorIndex);
            const bgColor = isDark ? color.bgDark : color.bg;

            return (
              <div
                key={selection.courseId}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-lg",
                  "bg-card border border-border",
                  "group hover:shadow-sm transition-shadow",
                )}
              >
                {/* Color dot */}
                <div
                  className="w-3 h-3 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: bgColor }}
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        onClick={() => setDetailCourse(course.id)}
                        className="text-sm font-medium truncate text-start hover:text-primary transition-colors"
                      >
                        {course.name}
                      </button>
                      <div className="text-xs text-muted-foreground">{course.id} | {course.credit} נק״ז</div>
                    </div>
                    <button
                      onClick={() => removeCourse(selection.courseId)}
                      className="p-1 hover:bg-destructive/10 rounded opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>

                  <GroupSelector
                    course={course}
                    selectedGroups={selection.selectedGroups}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
