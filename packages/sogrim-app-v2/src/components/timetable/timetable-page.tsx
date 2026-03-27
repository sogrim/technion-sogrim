import { useEffect, useMemo } from "react";
import { useTimetableStore, resolveEvents } from "@/stores/timetable-store";
import { useApiProvider, useProviderUpdates, getApiProvider } from "@/hooks/use-api-provider";
import { useTimetableSync } from "@/hooks/use-timetable-sync";
import { Loader2 } from "lucide-react";
import { TimetableToolbar } from "./timetable-toolbar";
import { WeekGrid } from "./week-grid";
import { DayView } from "./day-view";
import { CourseSearch } from "./course-search";
import { SelectedCoursesPanel } from "./selected-courses-panel";
import { ExamTimeline } from "./exam-timeline";
import { CourseDetailModal } from "./course-detail-modal";

export function TimetablePage() {
  const { ready, error } = useApiProvider();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" dir="rtl">
        <div className="text-destructive text-lg font-medium">{error}</div>
        <p className="text-muted-foreground text-sm">
          נסה לרענן את הדף. אם הבעיה נמשכת, ייתכן שהשרת לא זמין.
        </p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">טוען נתוני קורסים...</p>
      </div>
    );
  }

  return <TimetableContent />;
}

function TimetableContent() {
  // Sync timetable state with the backend (load + debounced save + unload flush)
  useTimetableSync(getApiProvider());

  // Subscribe to provider updates — also used as a dependency to re-resolve
  // events when course details arrive from the API
  const providerVersion = useProviderUpdates();

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
    [activeDraft, previewingCourse, previewingType, providerVersion],
  );

  const hasCourses = (activeDraft?.courses.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-8" dir="rtl">
      {/* Toolbar */}
      <TimetableToolbar events={events} />

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Grid — always visible */}
        <div className="flex-1 min-w-0">
          {viewMode === "week" ? (
            <>
              <div className="hidden md:block">
                <WeekGrid events={events} />
              </div>
              <div className="md:hidden">
                <WeekGrid events={events} compact />
              </div>
            </>
          ) : (
            <DayView events={events} />
          )}
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
