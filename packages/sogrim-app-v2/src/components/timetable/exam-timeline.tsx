import { useMemo } from "react";
import { useTimetableStore } from "@/stores/timetable-store";
import { getProvider } from "@/data/course-schedule-provider";
import { getCourseColor } from "@/lib/timetable-colors";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { CalendarCheck, AlertTriangle } from "lucide-react";

interface ExamInfo {
  courseId: string;
  courseName: string;
  colorIndex: number;
  dateA?: Date;
  dateB?: Date;
  dateAStr?: string;
  dateBStr?: string;
  timeA?: string;
  timeB?: string;
}

function parseExamDate(str?: string): Date | undefined {
  if (!str) return undefined;
  // Format: "YYYY-MM-DD" or "DD-MM-YYYY"
  const parts = str.split(/[-/]/);
  if (parts.length < 3) return undefined;
  // Try YYYY-MM-DD first
  if (parts[0].length === 4) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  // DD-MM-YYYY
  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
}

function formatDate(d: Date): string {
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function getDayLabel(days: number): { text: string; severity: "ok" | "warning" | "danger" } {
  if (days <= 2) return { text: `${days} ימים`, severity: "danger" };
  if (days <= 5) return { text: `${days} ימים`, severity: "warning" };
  return { text: `${days} ימים`, severity: "ok" };
}

export function ExamTimeline() {
  const drafts = useTimetableStore((s) => s.drafts);
  const activeDraftId = useTimetableStore((s) => s.activeDraftId);
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  const draft = drafts.find((d) => d.id === activeDraftId);

  const { examInfos, timelineA, timelineB } = useMemo(() => {
    if (!draft) return { examInfos: [], timelineA: [], timelineB: [] };

    const provider = getProvider();
    const infos: ExamInfo[] = [];

    draft.courses.forEach((sel, idx) => {
      const course = provider.getCourse(sel.courseId);
      if (!course) return;
      const dateA = parseExamDate(course.examA);
      const dateB = parseExamDate(course.examB);
      if (!dateA && !dateB) return;

      infos.push({
        courseId: course.id,
        courseName: course.name,
        colorIndex: idx,
        dateA,
        dateB,
        dateAStr: course.examA,
        dateBStr: course.examB,
        timeA: course.examATime,
        timeB: course.examBTime,
      });
    });

    // Build sorted timeline for מועד א and מועד ב
    const buildTimeline = (
      getDate: (e: ExamInfo) => Date | undefined,
      getTime: (e: ExamInfo) => string | undefined,
    ) => {
      const withDates = infos
        .filter((e) => getDate(e) != null)
        .sort((a, b) => getDate(a)!.getTime() - getDate(b)!.getTime());

      const items: {
        exam: ExamInfo;
        date: Date;
        time?: string;
        gapDays?: number;
        gapSeverity?: "ok" | "warning" | "danger";
      }[] = [];

      for (let i = 0; i < withDates.length; i++) {
        const date = getDate(withDates[i])!;
        let gapDays: number | undefined;
        let gapSeverity: "ok" | "warning" | "danger" | undefined;

        if (i > 0) {
          const prevDate = getDate(withDates[i - 1])!;
          gapDays = daysBetween(prevDate, date);
          gapSeverity = getDayLabel(gapDays).severity;
        }

        items.push({ exam: withDates[i], date, time: getTime(withDates[i]), gapDays, gapSeverity });
      }

      return items;
    };

    return {
      examInfos: infos,
      timelineA: buildTimeline((e) => e.dateA, (e) => e.timeA),
      timelineB: buildTimeline((e) => e.dateB, (e) => e.timeB),
    };
  }, [draft]);

  if (examInfos.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <CalendarCheck className="h-4 w-4 text-primary" />
        <span>לוח מבחנים</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ExamSession
          label="מועד א׳"
          timeline={timelineA}
          isDark={isDark}
        />
        <ExamSession
          label="מועד ב׳"
          timeline={timelineB}
          isDark={isDark}
        />
      </div>
    </div>
  );
}

function ExamSession({
  label,
  timeline,
  isDark,
}: {
  label: string;
  timeline: {
    exam: ExamInfo;
    date: Date;
    time?: string;
    gapDays?: number;
    gapSeverity?: "ok" | "warning" | "danger";
  }[];
  isDark: boolean;
}) {
  if (timeline.length === 0) return null;

  const minGap = Math.min(
    ...timeline.filter((t) => t.gapDays != null).map((t) => t.gapDays!),
  );
  const hasProblems = minGap <= 2;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        {timeline.length > 1 && (
          <span className={cn(
            "text-[0.65rem] px-1.5 py-0.5 rounded-full font-medium",
            hasProblems
              ? "bg-destructive/10 text-destructive"
              : "bg-success/10 text-success",
          )}>
            {hasProblems ? (
              <span className="flex items-center gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                מינימום {minGap} ימים בין מבחנים
              </span>
            ) : (
              `מינימום ${minGap} ימים בין מבחנים`
            )}
          </span>
        )}
      </div>

      {/* Visual timeline */}
      <div className="flex flex-col gap-0">
        {timeline.map((item) => {
          const color = getCourseColor(item.exam.colorIndex);
          const bg = isDark ? color.bgDark : color.bg;

          return (
            <div key={item.exam.courseId}>
              {/* Gap indicator between exams */}
              {item.gapDays != null && (
                <div className="flex items-center gap-2 py-0.5 px-3">
                  <div className={cn(
                    "flex-1 border-r-2 border-dashed h-4",
                    item.gapSeverity === "danger" ? "border-destructive" :
                    item.gapSeverity === "warning" ? "border-warning" :
                    "border-border",
                  )} />
                  <span className={cn(
                    "text-[0.65rem] font-bold px-1.5 py-0.5 rounded",
                    item.gapSeverity === "danger" ? "text-destructive bg-destructive/10" :
                    item.gapSeverity === "warning" ? "text-warning bg-warning/10" :
                    "text-muted-foreground",
                  )}>
                    {item.gapDays} ימים
                  </span>
                  <div className={cn(
                    "flex-1 border-r-2 border-dashed h-4",
                    item.gapSeverity === "danger" ? "border-destructive" :
                    item.gapSeverity === "warning" ? "border-warning" :
                    "border-border",
                  )} />
                </div>
              )}

              {/* Exam card */}
              <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors">
                <div
                  className="w-2 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: bg }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{item.exam.courseName}</div>
                  <div className="text-[0.65rem] text-muted-foreground">{item.exam.courseId}</div>
                </div>
                <div className="text-end shrink-0">
                  <div className="text-sm font-mono font-semibold">
                    {formatDate(item.date)}
                  </div>
                  {item.time && (
                    <div className="text-[0.65rem] font-mono text-muted-foreground">
                      {item.time}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
