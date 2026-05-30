import { useState, useMemo, useRef } from "react";
import { ChevronDown, ChevronUp, BookOpenCheck, Target, CalendarRange, CalendarDays, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComputeButton } from "./compute-button";
import { isSocialActivityCourse } from "@/lib/reserved-credits";
import { formatSemesterName, parseSemesterOrder, semesterKey, semestersEqual } from "@/lib/semester-utils";
import { useTimelineStore, distinctAcademicYears } from "@/stores/timeline-store";
import type { AcademicSemester, DegreeStatus, Catalog, CourseStatus } from "@/types/api";

/** Per-semester GPA, ordered chronologically (uses parseSemesterOrder so
 *  spring/winter/summer interleave correctly). */
function computePerSemesterGPA(
  courses: CourseStatus[],
): { semester: string; gpa: number }[] {
  const bySemester = new Map<
    string,
    { semester: AcademicSemester; tg: number; tc: number }
  >();
  for (const cs of courses) {
    if (cs.state !== "הושלם" || !cs.semester || !cs.grade) continue;
    if (isSocialActivityCourse(cs)) continue;
    const grade = parseFloat(cs.grade);
    if (isNaN(grade)) continue;
    const credit = cs.course.credit;
    const key = semesterKey(cs.semester);
    const entry = bySemester.get(key) ?? { semester: cs.semester, tg: 0, tc: 0 };
    entry.tg += grade * credit;
    entry.tc += credit;
    bySemester.set(key, entry);
  }
  return Array.from(bySemester.values())
    .filter((e) => e.tc > 0)
    .sort((a, b) => parseSemesterOrder(a.semester) - parseSemesterOrder(b.semester))
    .map((e) => ({ semester: formatSemesterName(e.semester), gpa: e.tg / e.tc }));
}

function GPASparkline({ data }: { data: { semester: string; gpa: number }[] }) {
  const W = 220;
  const H = 56;
  const P = 6;
  const min = Math.min(...data.map((d) => d.gpa));
  const max = Math.max(...data.map((d) => d.gpa));
  const range = Math.max(max - min, 4);
  const padded = { lo: min - range * 0.15, hi: max + range * 0.15 };
  const span = padded.hi - padded.lo || 1;
  const x = (i: number) => P + (i / Math.max(1, data.length - 1)) * (W - 2 * P);
  const y = (g: number) => H - P - ((g - padded.lo) / span) * (H - 2 * P);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.gpa)}`).join(" ");
  const area = `${path} L ${x(data.length - 1)} ${H - P} L ${x(0)} ${H - P} Z`;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const updateActiveFromPointer = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    const viewX = ((clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const d = Math.abs(x(i) - viewX);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }
    setActiveIdx(nearest);
  };

  const active = activeIdx != null ? data[activeIdx] : null;
  const activeXPct = activeIdx != null ? (x(activeIdx) / W) * 100 : 0;
  const activeYPct = active ? (y(active.gpa) / H) * 100 : 0;
  const tooltipShiftX = activeXPct < 12 ? "0%" : activeXPct > 88 ? "-100%" : "-50%";

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-12"
        preserveAspectRatio="none"
        onPointerMove={(e) => updateActiveFromPointer(e.clientX)}
        onPointerDown={(e) => updateActiveFromPointer(e.clientX)}
        onPointerLeave={() => setActiveIdx(null)}
      >
        <defs>
          <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sparkfill)" className="text-[#d66563]" />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinejoin="round" strokeLinecap="round" className="text-[#d66563]" />
        {data.map((d, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(d.gpa)}
            r="2"
            className={cn("fill-[#d66563]", activeIdx === i && "opacity-0")}
          />
        ))}
        {activeIdx != null && active && (
          <g className="pointer-events-none">
            <line
              x1={x(activeIdx)}
              y1={P}
              x2={x(activeIdx)}
              y2={H - P}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2 2"
              className="text-[#d66563]/40"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={x(activeIdx)}
              cy={y(active.gpa)}
              r="5"
              className="fill-[#d66563]/25"
            />
            <circle
              cx={x(activeIdx)}
              cy={y(active.gpa)}
              r="2.75"
              className="fill-[#d66563]"
              stroke="white"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}
      </svg>
      {active && (
        <div
          dir="rtl"
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-popover px-2 py-1 text-[11px] leading-tight text-popover-foreground shadow-md whitespace-nowrap"
          style={{
            left: `${activeXPct}%`,
            top: `${activeYPct}%`,
            transform: `translate(${tooltipShiftX}, calc(-100% - 8px))`,
          }}
        >
          <div className="font-medium text-foreground">{active.semester}</div>
          <div className="tabular-nums text-muted-foreground text-[10px]" dir="ltr">
            {active.gpa.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}

interface BannerProps {
  degreeStatus: DegreeStatus;
  catalog?: Catalog;
  includeInProgress: boolean;
  onToggleInProgress: (v: boolean) => void;
}

export function Banner({ degreeStatus, catalog, includeInProgress, onToggleInProgress }: BannerProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const { course_bank_requirements, course_statuses, total_credit } = degreeStatus;

  const totalRequired = catalog?.total_credit ?? 0;
  const completedCredit = course_statuses.reduce(
    (sum, cs) => (cs.state === "הושלם" && !isSocialActivityCourse(cs) ? sum + cs.course.credit : sum),
    0
  );
  const inProgressCredit = course_statuses.reduce(
    (sum, cs) => ((cs.state === "הושלם" || cs.state === "בתהליך") && !isSocialActivityCourse(cs) ? sum + cs.course.credit : sum),
    0
  );
  const effectiveCredit = Math.max(inProgressCredit, total_credit);
  const displayedCredit = includeInProgress ? effectiveCredit : completedCredit;
  const pct = totalRequired > 0 ? Math.min(100, Math.round((displayedCredit / totalRequired) * 100)) : 0;

  const completedBanks = course_bank_requirements.filter(
    (b) => b.completed ?? b.credit_completed >= b.credit_requirement
  ).length;
  const totalBanks = course_bank_requirements.length;

  const gradedCourses = course_statuses.filter((cs) => {
    if (cs.state !== "הושלם" || !cs.grade) return false;
    return !isNaN(parseFloat(cs.grade));
  });
  const totalGP = gradedCourses.reduce((s, cs) => s + parseFloat(cs.grade!) * cs.course.credit, 0);
  const totalGC = gradedCourses.reduce((s, cs) => s + cs.course.credit, 0);
  const gpaNum = totalGC > 0 ? totalGP / totalGC : null;
  const gpa = gpaNum != null ? gpaNum.toFixed(2) : "--";

  const completedCount = course_statuses.filter(
    (cs) => cs.state === "הושלם" && !isSocialActivityCourse(cs),
  ).length;
  const semesterGPA = useMemo(
    () => computePerSemesterGPA(course_statuses),
    [course_statuses],
  );
  const gpaDelta = semesterGPA.length >= 2
    ? semesterGPA[semesterGPA.length - 1].gpa - semesterGPA[semesterGPA.length - 2].gpa
    : null;
  const timelinePositions = useTimelineStore((s) => s.positions);
  const yearsOfStudy = useMemo(() => {
    if (timelinePositions.length > 0) {
      const years = distinctAcademicYears(timelinePositions);
      if (years > 0) return years;
    }
    const years = new Set<number>();
    for (const cs of course_statuses) {
      if (!cs.semester) continue;
      years.add(cs.semester.start_year);
    }
    return years.size > 0 ? years.size : null;
  }, [course_statuses, timelinePositions]);
  const lastSemester = useMemo(() => {
    let result: AcademicSemester | null = null;
    let maxOrder = -Infinity;
    for (const cs of course_statuses) {
      if (!cs.semester) continue;
      const order = parseSemesterOrder(cs.semester);
      if (order > maxOrder) {
        maxOrder = order;
        result = cs.semester;
      }
    }
    return result;
  }, [course_statuses]);
  const lastSemesterCredits = useMemo(() => {
    if (!lastSemester) return null;
    return course_statuses
      .filter((cs) =>
        semestersEqual(cs.semester, lastSemester) &&
        cs.state !== "לא רלוונטי" &&
        !isSocialActivityCourse(cs),
      )
      .reduce((sum, cs) => sum + cs.course.credit, 0);
  }, [course_statuses, lastSemester]);

  return (
    <div
      className="md:-mx-6 md:px-6 md:py-5"
      style={{ backgroundColor: "#24333c" }}
    >
      {/* ===== MOBILE: Compact summary strip ===== */}
      <div className="md:hidden px-4 py-3">
        <button
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="w-full"
          type="button"
        >
          {/* Always visible: progress bar + key stats */}
          <div className="flex items-center gap-3 text-white">
            <span className="text-sm font-bold shrink-0" dir="ltr">{pct}%</span>
            <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? "#4ade80" : "#d66563" }}
              />
            </div>
            <span className="text-xs text-white/70 shrink-0">
              {displayedCredit}/{totalRequired}
            </span>
            {mobileExpanded ? (
              <ChevronUp className="h-4 w-4 text-white/50 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white/50 shrink-0" />
            )}
          </div>
        </button>

        {/* Expanded details */}
        {mobileExpanded && (
          <div className="mt-3 space-y-2 text-white text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">ממוצע</span>
              <span className="font-bold">{gpa}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">דרישות</span>
              <span>{completedBanks}/{totalBanks}</span>
            </div>
            {catalog && (
              <div className="flex justify-between">
                <span className="text-white/70">קטלוג</span>
                <span className="text-xs">{catalog.name}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/60">כולל בתהליך</span>
                <button
                  role="switch"
                  aria-checked={includeInProgress}
                  onClick={(e) => { e.stopPropagation(); onToggleInProgress(!includeInProgress); }}
                  className={cn(
                    "relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors",
                    includeInProgress ? "bg-blue-400" : "bg-white/30"
                  )}
                >
                  <span className={cn(
                    "inline-block h-3 w-3 mt-0.5 rounded-full bg-white shadow transition-transform",
                    includeInProgress ? "translate-x-0.5" : "translate-x-3.5"
                  )} />
                </button>
              </div>
              <ComputeButton />
            </div>
          </div>
        )}
      </div>

      {/* ===== DESKTOP: Two cards ===== */}
      <div className="hidden md:flex mx-auto max-w-4xl gap-6">
        {/* Status card */}
        <div className="flex-1 rounded-xl bg-card border border-border px-5 py-4 flex flex-col">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-sm font-bold text-foreground">סטטוס תואר</h3>
          </div>
          <div className="flex items-center justify-end gap-2 mb-3">
            <span className="text-[10px] text-muted-foreground">כולל קורסים בתהליך</span>
            <button
              role="switch"
              aria-checked={includeInProgress}
              onClick={() => onToggleInProgress(!includeInProgress)}
              className={cn(
                "relative inline-flex h-4 w-8 shrink-0 rounded-full border-2 border-transparent transition-colors",
                includeInProgress ? "bg-blue-500" : "bg-muted"
              )}
            >
              <span className={cn(
                "inline-block h-3 w-3 rounded-full bg-white shadow transition-transform",
                includeInProgress ? "translate-x-0" : "-translate-x-4"
              )} />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-foreground min-w-[40px]" dir="ltr">{pct}%</span>
            <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? "#4ade80" : "#d66563" }}
              />
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground text-center flex-1 flex items-center justify-center">
            השלמת {displayedCredit} מתוך {totalRequired} נקודות
          </p>
          {catalog && <p className="text-xs text-muted-foreground text-center mt-2">{catalog.name}</p>}
          <div className="mt-3 flex justify-center">
            <ComputeButton />
          </div>
        </div>

        {/* Stats card */}
        <div className="flex-1 rounded-xl bg-card border border-border px-5 py-4 flex flex-col">
          <h3 className="text-sm font-bold text-foreground mb-3">סטטיסטיקות תואר</h3>

          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span className="text-3xl font-bold text-foreground tabular-nums">{gpa}</span>
            <span className="text-xs text-muted-foreground">ממוצע כללי</span>
            {gpaDelta != null && gpaDelta > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums text-green-600 dark:text-green-400"
                title="עלייה לעומת הסמסטר הקודם"
              >
                <ArrowUpRight className="h-3 w-3" />
                +{gpaDelta.toFixed(1)}
              </span>
            )}
          </div>

          {semesterGPA.length >= 2 ? (
            <div className="px-1 mb-3">
              <GPASparkline data={semesterGPA} />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <div className="grid grid-cols-4 gap-2 mt-auto pt-3 border-t border-border/50">
            <div className="flex flex-col items-center text-center gap-0.5">
              <BookOpenCheck className="h-3 w-3 text-muted-foreground/70" />
              <div className="text-base font-bold text-foreground tabular-nums leading-none">{completedCount}</div>
              <div className="text-[10px] text-muted-foreground">קורסים</div>
            </div>
            <div className="flex flex-col items-center text-center gap-0.5">
              <Target className="h-3 w-3 text-muted-foreground/70" />
              <div className="text-base font-bold text-foreground tabular-nums leading-none">
                {completedBanks}/{totalBanks > 0 ? totalBanks : "..."}
              </div>
              <div className="text-[10px] text-muted-foreground">דרישות</div>
            </div>
            <div className="flex flex-col items-center text-center gap-0.5">
              <CalendarRange className="h-3 w-3 text-muted-foreground/70" />
              <div className="text-base font-bold text-foreground tabular-nums leading-none">
                {yearsOfStudy != null ? yearsOfStudy : "--"}
              </div>
              <div className="text-[10px] text-muted-foreground">שנים</div>
            </div>
            <div className="flex flex-col items-center text-center gap-0.5">
              <CalendarDays className="h-3 w-3 text-muted-foreground/70" />
              <div className="text-base font-bold text-foreground tabular-nums leading-none">
                {lastSemesterCredits != null ? lastSemesterCredits : "--"}
              </div>
              <div className="text-[10px] text-muted-foreground">נק״ז הסמסטר</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
