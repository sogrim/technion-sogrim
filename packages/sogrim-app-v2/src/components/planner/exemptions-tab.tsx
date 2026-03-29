import { Badge } from "@/components/ui/badge";
import type { CourseStatus } from "@/types/api";

interface ExemptionsTabProps {
  courseStatuses: CourseStatus[];
}

export function ExemptionsTab({ courseStatuses }: ExemptionsTabProps) {
  const exemptionCourses = courseStatuses.filter(
    (cs) =>
      cs.semester === null &&
      (cs.grade === "פטור ללא ניקוד" || cs.grade === "פטור עם ניקוד")
  );

  if (exemptionCourses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4 opacity-30">
          {"\u2714\uFE0F"}
        </div>
        <h3 className="text-lg font-medium text-muted-foreground">
          {"\u05D0\u05D9\u05DF \u05E4\u05D8\u05D5\u05E8\u05D9\u05DD \u05D5\u05D6\u05D9\u05DB\u05D5\u05D9\u05D9\u05DD"}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          {"\u05E7\u05D5\u05E8\u05E1\u05D9\u05DD \u05DC\u05DC\u05D0 \u05E1\u05DE\u05E1\u05D8\u05E8 \u05DE\u05E9\u05D5\u05D9\u05DB\u05D9\u05DD \u05D9\u05D5\u05E4\u05D9\u05E2\u05D5 \u05DB\u05D0\u05DF"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 bg-muted px-4 py-3 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-4 text-right">
            {"\u05E9\u05DD \u05D4\u05E7\u05D5\u05E8\u05E1"}
          </div>
          <div className="col-span-2 text-right">
            {"\u05DE\u05E1\u05F3 \u05E7\u05D5\u05E8\u05E1"}
          </div>
          <div className="col-span-2 text-center">
            {"\u05E0\u05E7\u05F4\u05D6"}
          </div>
          <div className="col-span-2 text-center">
            {"\u05E6\u05D9\u05D5\u05DF"}
          </div>
          <div className="col-span-2 text-center">
            {"\u05E1\u05D8\u05D8\u05D5\u05E1"}
          </div>
        </div>

        {/* Table rows */}
        {exemptionCourses.map((cs) => (
          <div
            key={cs.course._id}
            className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b last:border-b-0 hover:bg-muted transition-colors"
          >
            <div className="col-span-4 text-right font-medium text-foreground truncate">
              {cs.course.name}
            </div>
            <div className="col-span-2 text-right text-muted-foreground" dir="ltr">
              {cs.course._id}
            </div>
            <div className="col-span-2 text-center text-foreground">
              {cs.course.credit}
            </div>
            <div className="col-span-2 text-center text-foreground">
              {cs.grade ?? "-"}
            </div>
            <div className="col-span-2 text-center">
              <Badge
                variant={
                  cs.state === "\u05D4\u05D5\u05E9\u05DC\u05DD"
                    ? "success-muted"
                    : cs.state === "\u05DC\u05D0 \u05D4\u05D5\u05E9\u05DC\u05DD"
                      ? "destructive-outline"
                      : cs.state === "\u05D1\u05EA\u05D4\u05DC\u05D9\u05DA"
                        ? "info-outline"
                        : "muted-outline"
                }
                className="text-[10px]"
              >
                {cs.state}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-sm text-muted-foreground text-center">
        {"\u05E1\u05D4\u05F4\u05DB"} {exemptionCourses.length}{" "}
        {"\u05E7\u05D5\u05E8\u05E1\u05D9\u05DD"} |{" "}
        {exemptionCourses
          .reduce((sum, cs) => sum + cs.course.credit, 0)
          .toFixed(1)}{" "}
        {"\u05E0\u05E7\u05F4\u05D6"}
      </div>
    </div>
  );
}
