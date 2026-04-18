import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComputeButton } from "./compute-button";
import { isReservedCourse, getTotalAllocatedReservedCredits } from "@/lib/reserved-credits";
import type { DegreeStatus, Catalog } from "@/types/api";

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
    (sum, cs) => (cs.state === "הושלם" && !isReservedCourse(cs) ? sum + cs.course.credit : sum),
    0
  );
  const inProgressCredit = course_statuses.reduce(
    (sum, cs) => ((cs.state === "הושלם" || cs.state === "בתהליך") && !isReservedCourse(cs) ? sum + cs.course.credit : sum),
    0
  );
  const allocatedCredit = getTotalAllocatedReservedCredits(course_statuses);
  const effectiveCredit = Math.max(inProgressCredit, total_credit) + allocatedCredit;
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
  const gpa = totalGC > 0 ? (totalGP / totalGC).toFixed(2) : "--";

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
          <h3 className="text-sm font-bold text-foreground mb-4">סטטיסטיקות תואר</h3>
          <p className="text-lg text-foreground text-center mb-2">
            ממוצע כללי: <span className="font-bold">{gpa}</span>
          </p>
          <p className="text-sm text-foreground text-center flex-1 flex items-center justify-center">
            השלמת {completedBanks} מתוך {totalBanks > 0 ? totalBanks : "..."} דרישות בתואר
          </p>
        </div>
      </div>
    </div>
  );
}
