import { useEffect, useMemo } from "react";
import { useTimetableStore, resolveEvents } from "@/stores/timetable-store";
import { StaticProvider } from "@/data/static-provider";
import { setProvider, getProvider } from "@/data/course-schedule-provider";
import { courseSchedules } from "@/data/courses/course-data";
import { availableSemesters } from "@/data/courses/semesters";
import { TimetableToolbar } from "./timetable-toolbar";
import { WeekGrid } from "./week-grid";
import { DayView } from "./day-view";
import { CourseSearch } from "./course-search";
import { SelectedCoursesPanel } from "./selected-courses-panel";
import { ExamTimeline } from "./exam-timeline";
import { CourseDetailModal } from "./course-detail-modal";

// Initialize the data provider
try {
  getProvider();
} catch {
  setProvider(new StaticProvider(courseSchedules, availableSemesters));
}

export function TimetablePage() {
  const viewMode = useTimetableStore((s) => s.viewMode);
  const drafts = useTimetableStore((s) => s.drafts);
  const activeDraftId = useTimetableStore((s) => s.activeDraftId);
  const currentSemester = useTimetableStore((s) => s.currentSemester);
  const createDraft = useTimetableStore((s) => s.createDraft);

  // Auto-create first draft if none exist for this semester
  useEffect(() => {
    const state = useTimetableStore.getState();
    const semDrafts = state.drafts.filter((d) => d.semester === currentSemester);
    if (semDrafts.length === 0) {
      createDraft(currentSemester);
    } else if (!state.activeDraftId || !semDrafts.find((d) => d.id === state.activeDraftId)) {
      state.setActiveDraft(semDrafts[0].id);
    }
  }, [currentSemester, createDraft]);

  const previewingCourse = useTimetableStore((s) => s.previewingCourse);
  const previewingType = useTimetableStore((s) => s.previewingType);

  const activeDraft = drafts.find((d) => d.id === activeDraftId);
  const events = useMemo(
    () => resolveEvents(activeDraft, previewingCourse, previewingType),
    [activeDraft, previewingCourse, previewingType],
  );

  const hasCourses = (activeDraft?.courses.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-8" dir="rtl">
      {/* Toolbar */}
      <TimetableToolbar events={events} />

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Grid — always visible */}
        <div className="flex-1 min-w-0">
          {/* Desktop always shows week, mobile respects viewMode */}
          <div className="hidden md:block">
            <WeekGrid events={events} />
          </div>
          <div className="md:hidden">
            {viewMode === "week" ? (
              <WeekGrid events={events} compact />
            ) : (
              <DayView events={events} />
            )}
          </div>
        </div>

        {/* Selected courses sidebar — always visible */}
        <div className="lg:w-72 shrink-0">
          <SelectedCoursesPanel />
        </div>
      </div>

      {/* Exam timeline — below everything, separate section */}
      {hasCourses && <ExamTimeline />}

      {/* Course search dialog */}
      <CourseSearch />

      {/* Course detail modal */}
      <CourseDetailModal />
    </div>
  );
}
