import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import type { CourseStatus } from "@/types/api";
import type { RowData } from "@/types/domain";
import {
  isReservedCourse,
  SOCIAL_ACTIVITY_COURSES,
} from "@/lib/reserved-credits";

interface ExemptionsTabProps {
  courseStatuses: CourseStatus[];
  onAddCourse: (row: RowData) => void;
  onDeleteCourse: (courseNumber: string) => void;
}

export function ExemptionsTab({
  courseStatuses,
  onAddCourse,
  onDeleteCourse,
}: ExemptionsTabProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const exemptionCourses = courseStatuses
    .filter(
      (cs) =>
        cs.semester === null &&
        (cs.grade === "פטור ללא ניקוד" || cs.grade === "פטור עם ניקוד") &&
        !isReservedCourse(cs),
    )
    .sort((a, b) => a.course.credit - b.course.credit);

  const availableCourses = SOCIAL_ACTIVITY_COURSES.filter(
    (c) => !exemptionCourses.some((ec) => ec.course._id === c._id),
  );

  const selectedCourse = SOCIAL_ACTIVITY_COURSES.find(
    (c) => c._id === selectedCourseId,
  );

  function handleAdd() {
    if (!selectedCourse) return;
    onAddCourse({
      name: selectedCourse.name,
      courseNumber: selectedCourse._id,
      credit: selectedCourse.credit,
      grade: "פטור עם ניקוד",
      state: "הושלם",
      semester: null,
    });
    setSelectedCourseId("");
    setExpanded(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 bg-muted px-4 py-3 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-4 text-right">שם הקורס</div>
          <div className="col-span-2 text-right">מס׳ קורס</div>
          <div className="col-span-2 text-center">נק״ז</div>
          <div className="col-span-2 text-center">ציון</div>
          <div className="col-span-1 text-center">סטטוס</div>
          <div className="col-span-1 text-center">מחק</div>
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
            <div
              className="col-span-2 text-right text-muted-foreground"
              dir="ltr"
            >
              {cs.course._id}
            </div>
            <div className="col-span-2 text-center text-foreground">
              {cs.course.credit}
            </div>
            <div className="col-span-2 text-center text-foreground">
              {cs.grade ?? "-"}
            </div>
            <div className="col-span-1 text-center">
              <Badge
                variant={
                  cs.state === "הושלם"
                    ? "success-muted"
                    : cs.state === "לא הושלם"
                      ? "destructive-outline"
                      : cs.state === "בתהליך"
                        ? "info-outline"
                        : "muted-outline"
                }
                className="text-[10px]"
              >
                {cs.state}
              </Badge>
            </div>
            <div className="col-span-1 flex justify-center items-center">
              <button
                onClick={() => onDeleteCourse(cs.course._id)}
                className="flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                title="מחק קורס"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {exemptionCourses.length > 0 && (
        <div className="mt-3 text-sm text-muted-foreground text-center">
          סה״כ {exemptionCourses.length} קורסים |{" "}
          {exemptionCourses
            .reduce((sum, cs) => sum + cs.course.credit, 0)
            .toFixed(1)}{" "}
          נק״ז
        </div>
      )}

      {availableCourses.length > 0 && (
        <div className="flex justify-center pt-4 pb-8">
          {!expanded ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(true)}
              className="border-foreground/30 text-foreground hover:bg-foreground hover:text-background"
            >
              <Plus className="h-4 w-4" />
              הוסף קורס חדש
            </Button>
          ) : (
            <div className="w-full max-w-5xl">
              <div className="flex items-end gap-1.5 flex-wrap rounded-lg border bg-muted/50 p-3">
                {/* Course name dropdown */}
                <div className="flex-[2] min-w-[160px]">
                  <label className="text-[11px] text-muted-foreground mb-0.5 block">
                    שם הקורס
                  </label>
                  <Dropdown
                    value={selectedCourseId}
                    onChange={setSelectedCourseId}
                    options={availableCourses.map((c) => ({
                      value: c._id,
                      label: `${c._id} - ${c.name}`,
                    }))}
                    placeholder="בחר קורס..."
                  />
                </div>

                {/* Course number (auto-filled) */}
                <div className="min-w-[100px] flex-1">
                  <label className="text-[11px] text-muted-foreground mb-0.5 block">
                    מס׳ הקורס
                  </label>
                  <input
                    value={selectedCourse?._id ?? ""}
                    readOnly
                    dir="ltr"
                    className="w-full h-8 rounded border border-border bg-card px-2 text-sm text-center text-muted-foreground"
                  />
                </div>

                {/* Credits (auto-filled) */}
                <div className="min-w-[60px] w-[70px]">
                  <label className="text-[11px] text-muted-foreground mb-0.5 block">
                    נק״ז
                  </label>
                  <input
                    value={selectedCourse ? String(selectedCourse.credit) : ""}
                    readOnly
                    className="w-full h-8 rounded border border-border bg-card px-2 text-sm text-center text-muted-foreground"
                  />
                </div>

                {/* Grade (auto-filled) */}
                <div className="min-w-[100px] w-[120px]">
                  <label className="text-[11px] text-muted-foreground mb-0.5 block">
                    ציון
                  </label>
                  <input
                    value={selectedCourse ? "פטור עם ניקוד" : ""}
                    readOnly
                    className="w-full h-8 rounded border border-border bg-card px-2 text-sm text-center text-muted-foreground"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleAdd}
                    disabled={!selectedCourseId}
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-foreground text-background hover:bg-foreground/80 transition-colors disabled:opacity-40"
                    title="הוסף"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCourseId("");
                      setExpanded(false);
                    }}
                    className="flex items-center justify-center h-8 w-8 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                    title="ביטול"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
