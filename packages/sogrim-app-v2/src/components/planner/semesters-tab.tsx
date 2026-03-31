import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2, Snowflake, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getAllSemesters,
  formatSemesterName,
  getNextSemesterName,
  parseSemesterOrder,
} from "@/lib/semester-utils";
import { SemesterPanel } from "./semester-panel";
import type { CourseStatus } from "@/types/api";
import type { RowData, SemesterOption } from "@/types/domain";


interface SemestersTabProps {
  courseStatuses: CourseStatus[];
  bankNames: string[];
  currentSemesterIdx: number;
  extraSemesters?: string[];
  onSelectSemester: (idx: number) => void;
  onAddSemester: (semesterName: string) => void;
  onDeleteSemester: (semesterName: string) => void;
  onUpdateStatuses: (updatedStatuses: CourseStatus[]) => void;
  onDeleteCourse: (courseNumber: string) => void;
  onAddCourse: (row: RowData) => void;
}

const SEASON_OPTIONS: { label: string; value: SemesterOption }[] = [
  { label: "חורף", value: "Winter" },
  { label: "אביב", value: "Spring" },
  { label: "קיץ", value: "Summer" },
];

function EmptyState({
  onAddSemester,
}: {
  onAddSemester: (semesterName: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h3 className="text-xl font-medium text-foreground mb-6">
        {"באיזה סמסטר התחלתם את התואר? חורף או אביב?"}
      </h3>
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          className="px-8 py-4 text-base border-foreground text-foreground hover:bg-foreground hover:text-background gap-2"
          onClick={() => onAddSemester("חורף_1")}
        >
          <Snowflake className="h-5 w-5" />
          {"חורף"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="px-8 py-4 text-base border-foreground text-foreground hover:bg-foreground hover:text-background gap-2"
          onClick={() => onAddSemester("אביב_1")}
        >
          <Sun className="h-5 w-5" />
          {"אביב"}
        </Button>
      </div>
    </div>
  );
}

export function SemestersTab({
  courseStatuses,
  bankNames,
  currentSemesterIdx,
  extraSemesters = [],
  onSelectSemester,
  onAddSemester,
  onDeleteSemester,
  onUpdateStatuses,
  onDeleteCourse,
  onAddCourse,
}: SemestersTabProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const courseSemesters = getAllSemesters(courseStatuses);
  // Merge course-based semesters with extra (empty) semesters from parent
  const tabs = useMemo(() => {
    const merged = new Set([...courseSemesters, ...extraSemesters]);
    return Array.from(merged).sort((a, b) => {
      const aNum = parseSemesterOrder(a);
      const bNum = parseSemesterOrder(b);
      return aNum - bNum;
    });
  }, [courseSemesters, extraSemesters]);
  const currentSemester = tabs[currentSemesterIdx] ?? null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        addMenuRef.current &&
        !addMenuRef.current.contains(e.target as Node)
      ) {
        setShowAddMenu(false);
      }
    }
    if (showAddMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddMenu]);

  const handleAdd = useCallback(
    (type: SemesterOption) => {
      const name = getNextSemesterName(tabs, type);
      onAddSemester(name);
      setShowAddMenu(false);
    },
    [tabs, onAddSemester]
  );

  const handleDelete = useCallback(() => {
    const currentTab = tabs[currentSemesterIdx];
    if (currentTab !== null && currentTab !== undefined) {
      onDeleteSemester(currentTab);
      setShowDeleteConfirm(false);
    }
  }, [tabs, currentSemesterIdx, onDeleteSemester]);

  // Empty state - no semesters at all
  if (tabs.length === 0) {
    return <EmptyState onAddSemester={onAddSemester} />;
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Semester tab pills row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Semester pill buttons */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {tabs.map((semester, idx) => (
            <button
              key={semester ?? "__null"}
              onClick={() => onSelectSemester(idx)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors border",
                idx === currentSemesterIdx
                  ? "text-white border-transparent shadow-sm"
                  : "bg-card text-foreground border-foreground/30 hover:bg-muted"
              )}
              style={
                idx === currentSemesterIdx
                  ? { backgroundColor: "#24333c" }
                  : undefined
              }
            >
              {formatSemesterName(semester)}
            </button>
          ))}
        </div>

        {/* Add + Delete buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center justify-center h-8 w-8 rounded-full border border-foreground/30 text-foreground hover:bg-muted transition-colors"
              title="הוסף סמסטר"
            >
              <Plus className="h-4 w-4" />
            </button>
            {showAddMenu && (
              <div className="absolute top-full start-0 z-10 mt-1 rounded-md border bg-card shadow-md min-w-[120px]">
                {SEASON_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAdd(opt.value)}
                    className="block w-full px-4 py-2 text-start text-sm hover:bg-muted transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {currentSemester !== null && tabs.length > 0 && (
            <div className="relative">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center h-8 w-8 rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                  title="מחק סמסטר נוכחי"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {"למחוק?"}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    {"כן"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    {"לא"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Course grid for selected semester */}
      <SemesterPanel
        semester={currentSemester}
        courseStatuses={courseStatuses}
        bankNames={bankNames}
        onUpdateStatuses={onUpdateStatuses}
        onDeleteCourse={onDeleteCourse}
        onAddCourse={onAddCourse}
      />
    </div>
  );
}
