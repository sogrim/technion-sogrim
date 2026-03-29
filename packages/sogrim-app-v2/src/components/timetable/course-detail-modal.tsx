import { useMemo, useEffect } from "react";
import { useTimetableStore } from "@/stores/timetable-store";
import { getProvider } from "@/data/course-schedule-provider";
import { getCourseColor } from "@/lib/timetable-colors";
import { LESSON_TYPE_NAMES, DAY_NAMES } from "@/lib/timetable-utils";
import { useUiStore } from "@/stores/ui-store";
import type { CourseSchedule, LessonGroup } from "@/types/timetable";
import { cn } from "@/lib/utils";
import {
  X,
  GraduationCap,
  Clock,
  MapPin,
  Calendar,
  User,
  BookOpen,
  FileText,
  Link2,
} from "lucide-react";

export function CourseDetailModal() {
  const detailCourseId = useTimetableStore((s) => s.detailCourseId);
  const setDetailCourse = useTimetableStore((s) => s.setDetailCourse);
  const drafts = useTimetableStore((s) => s.drafts);
  const activeDraftId = useTimetableStore((s) => s.activeDraftId);
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  const draft = drafts.find((d) => d.id === activeDraftId);

  const { course, colorIndex } = useMemo(() => {
    if (!detailCourseId) return { course: undefined, colorIndex: 0 };
    const course = getProvider().getCourse(detailCourseId);
    const idx = draft?.courses.findIndex((c) => c.courseId === detailCourseId) ?? -1;
    return { course, colorIndex: idx >= 0 ? idx : 0 };
  }, [detailCourseId, draft]);

  // Close on Escape
  useEffect(() => {
    if (!detailCourseId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailCourse(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [detailCourseId, setDetailCourse]);

  if (!detailCourseId || !course) return null;

  const color = getCourseColor(colorIndex);
  const accentBg = isDark ? color.bgDark : color.bg;
  const close = () => setDetailCourse(null);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 animate-in fade-in-0 duration-150"
        onClick={close}
      />

      {/* Modal */}
      <div
        className={cn(
          "fixed z-50 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden",
          "animate-in fade-in-0 slide-in-from-bottom-4 duration-200",
          // Mobile: nearly full screen
          "inset-3 md:inset-auto",
          // Desktop: centered
          "md:top-[8%] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl md:max-h-[80vh]",
        )}
        dir="rtl"
      >
        {/* Header with accent color */}
        <div
          className="relative px-5 pt-5 pb-4"
          style={{ backgroundColor: accentBg }}
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-3 left-3 z-10 p-2 rounded-full bg-white/20 hover:bg-white/40 active:bg-white/50 transition-colors cursor-pointer"
            aria-label="סגור"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          <div className="text-white">
            <div className="text-xs font-mono opacity-80 mb-1">{course.id}</div>
            <h2 className="text-lg font-bold leading-tight">{course.name}</h2>
            <div className="flex items-center gap-3 mt-2 text-sm opacity-90">
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {course.credit} נק״ז
              </span>
              {course.faculty && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {course.faculty}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-12rem)] md:max-h-[55vh] p-5 space-y-5">
          {/* Weekly hours summary */}
          <HoursGrid course={course} />

          {/* Exam dates */}
          <ExamSection course={course} accentBg={accentBg} />

          {/* Syllabus */}
          {course.syllabus && (
            <DetailSection icon={FileText} title="תיאור הקורס">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {course.syllabus}
              </p>
            </DetailSection>
          )}

          {/* Lecturer in charge */}
          {course.lecturerInCharge && (
            <DetailSection icon={User} title="אחראי/ת הקורס">
              <p className="text-sm font-medium">{course.lecturerInCharge}</p>
            </DetailSection>
          )}

          {/* Prerequisites */}
          {course.prerequisites && (
            <DetailSection icon={Link2} title="מקצועות קדם">
              <p className="text-sm text-muted-foreground">{course.prerequisites}</p>
            </DetailSection>
          )}

          {/* Linked / corequisite courses */}
          {course.linkedCourses && (
            <DetailSection icon={Link2} title="מקצועות צמודים">
              <p className="text-sm text-muted-foreground font-mono">{course.linkedCourses}</p>
            </DetailSection>
          )}

          {/* No extra credit */}
          {course.noExtraCreditCourses && (
            <DetailSection icon={Link2} title="מקצועות ללא זיכוי נוסף">
              <p className="text-sm text-muted-foreground font-mono">{course.noExtraCreditCourses}</p>
            </DetailSection>
          )}

          {/* Schedule breakdown */}
          <ScheduleSection course={course} accentBg={accentBg} />

          {/* Notes */}
          {course.notes && (
            <DetailSection icon={FileText} title="הערות">
              <p className="text-sm text-muted-foreground">{course.notes}</p>
            </DetailSection>
          )}
        </div>
      </div>
    </>
  );
}

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      {children}
    </div>
  );
}

function HoursGrid({ course }: { course: CourseSchedule }) {
  const lectureHours = course.lectureHours ?? countHours(course.groups, "lecture");
  const tutorialHours = course.tutorialHours ?? countHours(course.groups, "tutorial");
  const labHours = course.labHours ?? countHours(course.groups, "lab");

  const items = [
    { label: "הרצאה", hours: lectureHours, icon: "🎓" },
    { label: "תרגול", hours: tutorialHours, icon: "✏️" },
    { label: "מעבדה", hours: labHours, icon: "🔬" },
  ].filter((i) => i.hours > 0);

  if (items.length === 0) return null;

  return (
    <div className="flex gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex-1 flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/50"
        >
          <span className="text-lg">{item.icon}</span>
          <span className="text-xs text-muted-foreground">{item.label}</span>
          <span className="text-sm font-bold">{item.hours} שעות</span>
        </div>
      ))}
    </div>
  );
}

function countHours(groups: LessonGroup[], type: string): number {
  // Get first group of this type and calculate hours from its lessons
  const group = groups.find((g) => g.type === type);
  if (!group) return 0;
  let total = 0;
  for (const lesson of group.lessons) {
    const [sh, sm] = lesson.startTime.split(":").map(Number);
    const [eh, em] = lesson.endTime.split(":").map(Number);
    total += (eh * 60 + em - sh * 60 - sm) / 60;
  }
  return Math.round(total * 10) / 10;
}

function ExamSection({
  course,
}: {
  course: CourseSchedule;
  accentBg?: string;
}) {
  if (!course.examA && !course.examB) return null;

  const formatExamDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    let day: string, month: string, year: string;
    if (parts[0].length === 4) {
      [year, month, day] = parts;
    } else {
      [day, month, year] = parts;
    }
    const date = `${day}/${month}/${year}`;
    return { date, time: timeStr };
  };

  const examA = formatExamDate(course.examA, course.examATime);
  const examB = formatExamDate(course.examB, course.examBTime);

  return (
    <DetailSection icon={Calendar} title="מועדי מבחנים">
      <div className="grid grid-cols-2 gap-2">
        {examA && (
          <div className="p-3 rounded-xl border border-border bg-secondary/30">
            <div className="text-[0.65rem] text-muted-foreground mb-1">מועד א׳</div>
            <div className="text-sm font-bold">{examA.date}</div>
            {examA.time && (
              <div className="text-xs text-muted-foreground mt-0.5">{examA.time}</div>
            )}
          </div>
        )}
        {examB && (
          <div className="p-3 rounded-xl border border-border bg-secondary/30">
            <div className="text-[0.65rem] text-muted-foreground mb-1">מועד ב׳</div>
            <div className="text-sm font-bold">{examB.date}</div>
            {examB.time && (
              <div className="text-xs text-muted-foreground mt-0.5">{examB.time}</div>
            )}
          </div>
        )}
      </div>
    </DetailSection>
  );
}

function ScheduleSection({
  course,
  accentBg,
}: {
  course: CourseSchedule;
  accentBg: string;
}) {
  // Group by type
  const byType = new Map<string, LessonGroup[]>();
  for (const g of course.groups) {
    const key = g.type;
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key)!.push(g);
  }

  return (
    <DetailSection icon={Clock} title="מערכת שעות">
      <div className="space-y-3">
        {Array.from(byType.entries()).map(([type, groups]) => (
          <div key={type}>
            <div className="text-xs font-semibold text-muted-foreground mb-1.5">
              {LESSON_TYPE_NAMES[type as keyof typeof LESSON_TYPE_NAMES] ?? type}
              {groups.length > 1 && ` (${groups.length} קבוצות)`}
            </div>
            <div className="space-y-1">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 text-sm"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: accentBg }}
                  >
                    {group.id.split("-")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    {group.lessons.map((lesson, li) => (
                      <div key={li} className="flex items-center gap-2 text-xs">
                        <span className="font-medium w-12">
                          {DAY_NAMES[lesson.day]}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {lesson.startTime}-{lesson.endTime}
                        </span>
                        {(lesson.building || lesson.room) && (
                          <span className="flex items-center gap-0.5 text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5" />
                            {[lesson.building, lesson.room].filter(Boolean).join(" ")}
                          </span>
                        )}
                        {lesson.instructor && (
                          <span className="flex items-center gap-0.5 text-muted-foreground truncate">
                            <User className="h-2.5 w-2.5 shrink-0" />
                            {lesson.instructor}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DetailSection>
  );
}
