import { useState } from "react";
import { ChevronDown, ChevronUp, Info, Ban, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CourseBankReq, CourseStatus } from "@/types/api";

interface BankRequirementCardProps {
  bank: CourseBankReq;
  courses: CourseStatus[];
  onIgnoreCourse: (courseId: string, action: "לא רלוונטי" | "לא הושלם") => void;
  includeInProgress: boolean;
}

export function BankRequirementCard({
  bank,
  courses,
  onIgnoreCourse,
  includeInProgress,
}: BankRequirementCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isAllBank = bank.bank_rule_name === "all";

  const bankCourses = courses.filter((cs) => cs.type === bank.course_bank_name);

  // When includeInProgress, add in-progress courses' credits/count to the backend totals
  const inProgressExtra = includeInProgress
    ? bankCourses.filter((cs) => cs.state === "בתהליך")
    : [];
  const extraCredit = inProgressExtra.reduce(
    (s, cs) => s + cs.course.credit,
    0,
  );
  const extraCount = inProgressExtra.length;

  const effectiveCreditCompleted = bank.credit_completed + extraCredit;
  const effectiveCourseCompleted = bank.course_completed + extraCount;

  const percentage = (() => {
    if (bank.credit_requirement > 0) {
      return Math.min(
        100,
        Math.round((effectiveCreditCompleted / bank.credit_requirement) * 100),
      );
    }
    if (bank.course_requirement > 0) {
      return Math.min(
        100,
        Math.round((effectiveCourseCompleted / bank.course_requirement) * 100),
      );
    }
    return bank.completed ? 100 : 0;
  })();

  const isCompleted = bank.completed ?? percentage >= 100;

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      {/* Accordion header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted"
      >
        {/* Chevron */}
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">
                {bank.course_bank_name}
              </span>
              {bank.message && (
                <span title={bank.message}>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              )}
            </div>
            <Badge
              variant={isCompleted ? "success-outline" : "info-outline"}
              className="shrink-0 text-xs"
            >
              {isCompleted ? "בוצע" : "בתהליך"}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: isCompleted ? "#4ade80" : "#d66563",
                  }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground shrink-0 w-8 text-left">
                {percentage}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {bank.credit_requirement > 0
                  ? `השלמת ${effectiveCreditCompleted} מתוך ${bank.credit_requirement} נק״ז`
                  : "אין דרישת נק״ז בקטגוריה זו"}
              </span>
              {bank.course_requirement > 0 && (
                <span>
                  {effectiveCourseCompleted}/{bank.course_requirement}{" "}
                  {"קורסים"}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded: course list */}
      {expanded && bankCourses.length > 0 && (
        <div className="border-t bg-muted px-4 py-3">
          <div className="space-y-1.5">
            {bankCourses.map((cs) => (
              <div
                key={cs.course._id}
                className="flex items-center justify-between text-sm py-1"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 min-w-0 cursor-default">
                          <span className="text-foreground truncate">
                            {cs.course.name}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({cs.course.credit} {"נק״ז"})
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>מס׳ קורס {cs.course._id}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {cs.additional_msg && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default shrink-0">
                            <Info className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{cs.additional_msg}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-muted-foreground text-xs">
                    {cs.grade ?? "-"}
                  </span>
                  <Badge
                    variant={
                      cs.state === "הושלם"
                        ? "success-outline"
                        : cs.state === "לא הושלם"
                          ? "destructive-outline"
                          : cs.state === "בתהליך"
                            ? "info-outline"
                            : "muted-outline"
                    }
                    className="text-[10px] px-1.5 py-0"
                  >
                    {cs.state}
                  </Badge>
                  {isAllBank && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {cs.state === "לא רלוונטי" ? (
                            <button
                              onClick={() =>
                                onIgnoreCourse(cs.course._id, "לא הושלם")
                              }
                              className="p-0.5 rounded hover:bg-background transition-colors text-green-600"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                onIgnoreCourse(cs.course._id, "לא רלוונטי")
                              }
                              className="p-0.5 rounded hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          {cs.state === "לא רלוונטי"
                            ? "בטל התעלמות מקורס זה"
                            : "התעלם מקורס זה בחישוב"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && bankCourses.length === 0 && (
        <div className="border-t bg-muted px-4 py-4 text-center text-sm text-muted-foreground">
          {"אין קורסים בקטגוריה זו"}
        </div>
      )}
    </div>
  );
}
