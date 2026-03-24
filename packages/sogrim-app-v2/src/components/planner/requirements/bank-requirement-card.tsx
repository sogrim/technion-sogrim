import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CourseBankReq, CourseStatus } from "@/types/api";

interface BankRequirementCardProps {
  bank: CourseBankReq;
  courses: CourseStatus[];
}

export function BankRequirementCard({
  bank,
  courses,
}: BankRequirementCardProps) {
  const [expanded, setExpanded] = useState(false);

  const percentage =
    bank.credit_requirement > 0
      ? Math.min(
          100,
          Math.round(
            (bank.credit_completed / bank.credit_requirement) * 100
          )
        )
      : 0;

  const isCompleted = bank.completed ?? percentage >= 100;

  const bankCourses = courses.filter(
    (cs) => cs.type === bank.course_bank_name
  );

  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      {/* Accordion header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-gray-50"
      >
        {/* Chevron */}
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#24333c] text-sm">
                {bank.course_bank_name}
              </span>
              {bank.message && (
                <span title={bank.message}>
                  <Info className="h-3.5 w-3.5 text-gray-400" />
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
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: isCompleted ? "#4ade80" : "#d66563",
                  }}
                />
              </div>
              <span className="text-xs font-medium text-gray-500 shrink-0 w-8 text-left">
                {percentage}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>
                {"השלמת"} {bank.credit_completed}{" "}
                {"מתוך"} {bank.credit_requirement}{" "}
                {"נק״ז"}
              </span>
              {bank.course_requirement > 0 && (
                <span>
                  {bank.course_completed}/{bank.course_requirement}{" "}
                  {"קורסים"}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded: course list */}
      {expanded && bankCourses.length > 0 && (
        <div className="border-t bg-gray-50 px-4 py-3">
          <div className="space-y-1.5">
            {bankCourses.map((cs) => (
              <div
                key={cs.course._id}
                className="flex items-center justify-between text-sm py-1"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#24333c] truncate">
                    {cs.course.name}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    ({cs.course.credit} {"נק״ז"})
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-gray-500 text-xs">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && bankCourses.length === 0 && (
        <div className="border-t bg-gray-50 px-4 py-4 text-center text-sm text-gray-400">
          {"אין קורסים בקטגוריה זו"}
        </div>
      )}
    </div>
  );
}
