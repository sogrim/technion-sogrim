import { useMemo, useState } from "react";
import { useTimetableStore } from "@/stores/timetable-store";
import { getProvider } from "@/data/course-schedule-provider";
import { getCourseColor } from "@/lib/timetable-colors";
import { useUiStore } from "@/stores/ui-store";
import { GroupSelector } from "./group-selector";
import { Trash2, BookOpen, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SelectedCoursesPanel() {
  const drafts = useTimetableStore((s) => s.drafts);
  const activeDraftId = useTimetableStore((s) => s.activeDraftId);
  const removeCourse = useTimetableStore((s) => s.removeCourse);
  const setSearchOpen = useTimetableStore((s) => s.setSearchOpen);
  const setDetailCourse = useTimetableStore((s) => s.setDetailCourse);
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const draft = drafts.find((d) => d.id === activeDraftId);

  const coursesWithData = useMemo(() => {
    if (!draft) return [];
    try {
      const provider = getProvider();
      return draft.courses.map((sel, index) => ({
        selection: sel,
        course: provider.getCourse(sel.courseId),
        colorIndex: index,
      }));
    } catch {
      return [];
    }
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
        <div className="space-y-1">
          {coursesWithData.map(({ selection, course, colorIndex }) => {
            if (!course) return null;
            const color = getCourseColor(colorIndex);
            const bgColor = isDark ? color.bgDark : color.bg;
            const isExpanded = expandedId === selection.courseId;

            return (
              <div
                key={selection.courseId}
                className={cn(
                  "rounded-lg border border-border overflow-hidden",
                  "bg-card transition-shadow",
                  isExpanded && "shadow-sm",
                )}
              >
                {/* Compact header — always visible */}
                <div
                  className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : selection.courseId)}
                >
                  {/* Color dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: bgColor }}
                  />

                  {/* Course name + credits */}
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate">{course.name}</span>
                    <span className="text-[0.65rem] text-muted-foreground shrink-0">{course.credit} נק״ז</span>
                  </div>

                  {/* Expand arrow */}
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                    isExpanded && "rotate-180",
                  )} />

                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCourse(selection.courseId);
                    }}
                    className="p-0.5 hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>

                {/* Expanded: group selectors + details */}
                {isExpanded && (
                  <div className="px-2 pb-2 pt-0.5 border-t border-border/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.65rem] text-muted-foreground">{course.id}</span>
                      <button
                        onClick={() => setDetailCourse(course.id)}
                        className="text-[0.65rem] text-primary hover:underline"
                      >
                        פרטי קורס
                      </button>
                    </div>
                    <GroupSelector
                      course={course}
                      selectedGroups={selection.selectedGroups}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
