import { useState, useCallback, useEffect, useRef } from "react";
import { useSearch } from "@tanstack/react-router";
import { useUserState } from "@/hooks/use-user-state";
import { useUpdateUserState } from "@/hooks/use-mutations";
import { useUiStore } from "@/stores/ui-store";
import {
  courseSemesterKey,
  getAllSemesters,
  parseSemesterOrder,
  semesterKey,
  semestersEqual,
} from "@/lib/semester-utils";
import { determineState } from "@/lib/course-validator";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Banner } from "./banner";
import { ModifiedToast } from "./modified-toast";
import { RequirementsPanel } from "./requirements/requirements-panel";
import { SemestersTab } from "./semesters-tab";
import { ExemptionsTab } from "./exemptions-tab";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { UserRegistrationState } from "@/types/domain";
import type { AcademicSemester, CourseState, CourseStatus, UserDetails } from "@/types/api";
import type { RowData } from "@/types/domain";

type PlannerTab = "requirements" | "semesters" | "exemptions";

const TABS: { key: PlannerTab; label: string }[] = [
  { key: "requirements", label: "\u05D3\u05E8\u05D9\u05E9\u05D5\u05EA" },
  { key: "semesters", label: "\u05E1\u05DE\u05E1\u05D8\u05E8\u05D9\u05DD" },
  {
    key: "exemptions",
    label: "\u05E4\u05D8\u05D5\u05E8\u05D9\u05DD \u05D5\u05D6\u05D9\u05DB\u05D5\u05D9\u05D9\u05DD",
  },
];

function getRegistrationState(details: UserDetails | undefined): number {
  if (!details) return UserRegistrationState.Loading;
  if (!details.catalog) return UserRegistrationState.NoCatalog;
  if (
    !details.degree_status.course_statuses ||
    details.degree_status.course_statuses.length === 0
  ) {
    return UserRegistrationState.NoCourses;
  }
  if (
    !details.degree_status.course_bank_requirements ||
    details.degree_status.course_bank_requirements.length === 0
  ) {
    return UserRegistrationState.NoComputeValue;
  }
  return UserRegistrationState.Ready;
}

export function PlannerPage() {
  const { data: userState, isLoading, error } = useUserState();
  const updateMutation = useUpdateUserState();
  const currentSemesterIdx = useUiStore((s) => s.currentSemesterIdx);
  const setCurrentSemester = useUiStore((s) => s.setCurrentSemester);
  // Read optional ?tab=... search param so other pages can deep-link into
  // a specific planner tab (e.g. timetable sync → semesters).
  const search = useSearch({ from: "/planner" }) as { tab?: PlannerTab };
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [activeTab, setActiveTab] = useState<PlannerTab>(search.tab ?? "requirements");

  // If the URL ?tab=... changes after mount (e.g. user clicks the sync
  // button while already on /planner), follow the navigation.
  useEffect(() => {
    if (search.tab && search.tab !== activeTab) {
      setActiveTab(search.tab);
    }
    // We intentionally omit `activeTab` from deps: this effect should only
    // react to external URL changes, not to user-driven tab clicks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.tab]);
  const [includeInProgress, setIncludeInProgress] = useState(
    () => userState?.details?.compute_in_progress ?? false
  );
  const [extraSemesters, setExtraSemesters] = useState<AcademicSemester[]>([]);

  const details = userState?.details;
  const registrationState = getRegistrationState(details);

  const courseStatuses = details?.degree_status.course_statuses ?? [];
  const bankNames = details?.catalog?.course_bank_names ?? [];

  // One-shot migration: pull legacy timeline annotations out of localStorage
  // (where they lived before the DB-backed flow) into UserDetails. We only
  // migrate `annotations` — the legacy `positions` field is meaningless under
  // the new model (drag now updates each course's start_year directly), so
  // it's dropped on the floor.
  const migratedAnnotationsRef = useRef(false);
  useEffect(() => {
    if (migratedAnnotationsRef.current) return;
    if (!details) return;
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("sogrim-timeline-v2");
    if (!raw) {
      migratedAnnotationsRef.current = true;
      return;
    }
    migratedAnnotationsRef.current = true;
    let parsed: { state?: { annotations?: Record<string, string> } };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Legacy blob is corrupt — nothing to migrate, safe to clear.
      window.localStorage.removeItem("sogrim-timeline-v2");
      return;
    }
    const legacyAnnotations = parsed.state?.annotations ?? {};
    const existingAnnotations = details.timeline_annotations ?? {};
    const merged: Record<string, string> = { ...existingAnnotations };
    let added = 0;
    for (const [k, v] of Object.entries(legacyAnnotations)) {
      if (merged[k] === undefined) {
        merged[k] = v;
        added++;
      }
    }
    if (added === 0) {
      // Nothing new to persist — safe to clear.
      window.localStorage.removeItem("sogrim-timeline-v2");
      return;
    }
    // Only remove the legacy blob after the server confirms it has the
    // merged annotations. If the mutation fails (network error, server
    // 500, expired token), leave localStorage alone so the next mount
    // gets another chance to migrate. Also reset the ref so the retry
    // can actually happen on the next render.
    updateMutation.mutate(
      { ...details, timeline_annotations: merged, modified: true },
      {
        onSuccess: () => {
          window.localStorage.removeItem("sogrim-timeline-v2");
        },
        onError: () => {
          migratedAnnotationsRef.current = false;
        },
      },
    );
  }, [details, updateMutation]);

  const sendUpdate = useCallback(
    (updatedStatuses: CourseStatus[]) => {
      if (!details) return;

      const updatedDetails: UserDetails = {
        ...details,
        degree_status: {
          ...details.degree_status,
          course_statuses: updatedStatuses,
        },
        modified: true,
      };
      updateMutation.mutate(updatedDetails, {
        onError: (err) => {
          const errorMsg =
            err instanceof Error ? err.message : String(err);
          const serverMsg =
            (err as { response?: { data?: string } })?.response?.data;
          setToast({
            message: serverMsg
              ? `שגיאה בשמירת הנתונים: ${serverMsg}`
              : `שגיאה בשמירת הנתונים: ${errorMsg}`,
            type: "error",
          });
        },
      });
    },
    [details, updateMutation]
  );

  const handleUpdateStatuses = useCallback(
    (updatedStatuses: CourseStatus[]) => {
      sendUpdate(updatedStatuses);
    },
    [sendUpdate]
  );

  const handleDeleteCourse = useCallback(
    (courseNumber: string, semester: AcademicSemester | null) => {
      const deleteKey = courseSemesterKey(courseNumber, semester);
      const updatedStatuses = courseStatuses.filter(
        (cs) => courseSemesterKey(cs.course._id, cs.semester) !== deleteKey
      );
      sendUpdate(updatedStatuses);
    },
    [courseStatuses, sendUpdate]
  );

  const handleAddCourse = useCallback(
    (row: RowData) => {
      const credit =
        typeof row.credit === "string" ? parseFloat(row.credit) : row.credit;
      const newCourseStatus: CourseStatus = {
        course: {
          _id: row.courseNumber,
          name: row.name,
          credit: isNaN(credit) ? 0 : credit,
        },
        grade: row.grade,
        semester: row.semester,
        state: (row.state as CourseStatus["state"]) || "\u05D1\u05EA\u05D4\u05DC\u05D9\u05DA",
        type: row.type,
        modified: true,
        times_repeated: 0,
      };
      const updatedStatuses = [...courseStatuses, newCourseStatus];
      sendUpdate(updatedStatuses);
    },
    [courseStatuses, sendUpdate]
  );

  const handleAddSemester = useCallback(
    (semesterName: AcademicSemester) => {
      setExtraSemesters((prev) => {
        const existing = getAllSemesters(courseStatuses);
        if (
          existing.some((s) => semestersEqual(s, semesterName)) ||
          prev.some((s) => semestersEqual(s, semesterName))
        ) {
          return prev;
        }
        return [...prev, semesterName];
      });

      // Switch to the newly-added semester tab. Replicate the same merge+sort
      // logic that SemestersTab uses so the index we compute here matches.
      const existing = getAllSemesters(courseStatuses);
      const updatedExtra = existing.some((s) => semestersEqual(s, semesterName))
        ? extraSemesters
        : [...extraSemesters, semesterName];
      const merged = new Map([...existing, ...updatedExtra].map((s) => [semesterKey(s), s]));
      const allTabs = Array.from(merged.values()).sort(
        (a, b) => parseSemesterOrder(a) - parseSemesterOrder(b),
      );
      const idx = allTabs.findIndex((t) => semestersEqual(t, semesterName));
      if (idx >= 0) {
        setCurrentSemester(idx);
      }
    },
    [courseStatuses, extraSemesters, setCurrentSemester],
  );

  const handleDeleteSemester = useCallback(
    (semesterName: AcademicSemester) => {
      setExtraSemesters((prev) =>
        prev.filter((s) => !semestersEqual(s, semesterName)),
      );

      const semesterHasCourses = courseStatuses.some(
        (cs) => semestersEqual(cs.semester, semesterName),
      );
      if (semesterHasCourses) {
        const updatedStatuses = courseStatuses
          .filter((cs) => !semestersEqual(cs.semester, semesterName));
        sendUpdate(updatedStatuses);
      }

      // Move to previous tab
      if (currentSemesterIdx > 0) {
        setCurrentSemester(currentSemesterIdx - 1);
      }
    },
    [courseStatuses, currentSemesterIdx, sendUpdate, setCurrentSemester],
  );

  // Drag-in-slider: the timeline asked to shift the semester at `fromIdx` and
  // every later semester by `deltaYears`. Translate that into start_year
  // updates on all matching course statuses (and on extraSemesters local state
  // for empty chips), shift gap annotations that sit inside the moved region,
  // then persist atomically via the existing user-details mutation so the new
  // position survives a refresh.
  const handleShiftSemestersFrom = useCallback(
    (fromOrdinalIdx: number, deltaYears: number) => {
      if (deltaYears === 0) return;
      if (!details) return;

      const existing = getAllSemesters(courseStatuses);
      const merged = new Map(
        [...existing, ...extraSemesters].map((s) => [semesterKey(s), s]),
      );
      const allTabs = Array.from(merged.values()).sort(
        (a, b) => parseSemesterOrder(a) - parseSemesterOrder(b),
      );
      if (fromOrdinalIdx < 0 || fromOrdinalIdx >= allTabs.length) return;

      // Build the affected set (semesters at or after fromIdx), keyed for fast lookup.
      const affected = new Set(
        allTabs.slice(fromOrdinalIdx).map(semesterKey),
      );

      // Defence-in-depth: confirm the shift preserves strict chronological
      // ordering against the unchanged earlier semester (if any). The
      // timeline component already validates this client-side; we re-check
      // before letting the change reach the DB.
      if (fromOrdinalIdx > 0) {
        const prev = allTabs[fromOrdinalIdx - 1];
        const shifted = allTabs[fromOrdinalIdx];
        const prevOrder = parseSemesterOrder(prev);
        const shiftedOrder = parseSemesterOrder({
          ...shifted,
          start_year: shifted.start_year + deltaYears,
        });
        if (shiftedOrder <= prevOrder) return;
      }

      // Shifting backwards into negative years is degenerate — bail.
      if (allTabs[fromOrdinalIdx].start_year + deltaYears < 0) return;

      const updatedStatuses = courseStatuses.map((cs) => {
        if (!cs.semester) return cs;
        if (!affected.has(semesterKey(cs.semester))) return cs;
        return {
          ...cs,
          semester: { ...cs.semester, start_year: cs.semester.start_year + deltaYears },
          modified: true,
        };
      });

      setExtraSemesters((prev) =>
        prev.map((s) =>
          affected.has(semesterKey(s))
            ? { ...s, start_year: s.start_year + deltaYears }
            : s,
        ),
      );

      // Shift gap annotations whose calendar idx sits at or after the first
      // shifted chip. Annotations to the left of the shift stay anchored —
      // they describe time before the moved block. Without this remap, a
      // drag would visually orphan labels (the chip moves but the gap label
      // stays put), or worse, the chip would land on top of an annotation
      // idx and silently hide it from the timeline render.
      const firstShiftedIdx = parseSemesterOrder(allTabs[fromOrdinalIdx]);
      const deltaSlots = deltaYears * 3;
      const oldAnnotations = details.timeline_annotations ?? {};
      const shiftedAnnotations: Record<string, string> = {};
      for (const [k, v] of Object.entries(oldAnnotations)) {
        const idx = Number(k);
        if (!Number.isFinite(idx)) {
          // Preserve unexpected non-numeric keys verbatim — don't lose data.
          shiftedAnnotations[k] = v;
          continue;
        }
        const newIdx = idx >= firstShiftedIdx ? idx + deltaSlots : idx;
        shiftedAnnotations[String(newIdx)] = v;
      }

      const updatedDetails: UserDetails = {
        ...details,
        degree_status: {
          ...details.degree_status,
          course_statuses: updatedStatuses,
        },
        timeline_annotations: shiftedAnnotations,
        modified: true,
      };
      updateMutation.mutate(updatedDetails, {
        onError: (err) => {
          const errorMsg = err instanceof Error ? err.message : String(err);
          const serverMsg =
            (err as { response?: { data?: string } })?.response?.data;
          setToast({
            message: serverMsg
              ? `שגיאה בשמירת הנתונים: ${serverMsg}`
              : `שגיאה בשמירת הנתונים: ${errorMsg}`,
            type: "error",
          });
        },
      });
    },
    [courseStatuses, details, extraSemesters, updateMutation],
  );

  const handleSetAnnotations = useCallback(
    (next: Record<string, string>) => {
      if (!details) return;
      const updatedDetails: UserDetails = {
        ...details,
        timeline_annotations: next,
        modified: true,
      };
      updateMutation.mutate(updatedDetails, {
        onError: (err) => {
          const errorMsg = err instanceof Error ? err.message : String(err);
          const serverMsg =
            (err as { response?: { data?: string } })?.response?.data;
          setToast({
            message: serverMsg
              ? `שגיאה בשמירת הנתונים: ${serverMsg}`
              : `שגיאה בשמירת הנתונים: ${errorMsg}`,
            type: "error",
          });
        },
      });
    },
    [details, updateMutation],
  );

  const handleIgnoreCourse = useCallback(
    (courseId: string, action: "לא רלוונטי" | "לא הושלם") => {
      const updatedStatuses = courseStatuses.map((cs) => {
        if (cs.course._id !== courseId) return cs;
        // When un-ignoring a course, restore the state implied by its grade
        // (e.g. a passing grade should return to "הושלם", not "לא הושלם").
        const newState: CourseState =
          action === "לא רלוונטי"
            ? "לא רלוונטי"
            : determineState(cs.grade);
        return { ...cs, state: newState, modified: true };
      });
      sendUpdate(updatedStatuses);
    },
    [courseStatuses, sendUpdate]
  );

  const isModified =
    details?.modified === true && courseStatuses.length > 0;

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="flex justify-center gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">
            {"\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D8\u05E2\u05D9\u05E0\u05EA \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  // --- Onboarding states ---
  if (registrationState === UserRegistrationState.NoCatalog) {
    return <OnboardingFlow currentStep="catalog" />;
  }
  if (registrationState === UserRegistrationState.NoCourses) {
    return <OnboardingFlow currentStep="courses" />;
  }
  if (registrationState === UserRegistrationState.NoComputeValue) {
    return <OnboardingFlow currentStep="computing" />;
  }

  // --- Ready state: full planner ---
  return (
    <div className="space-y-0">
      {/* Modified Toast - always reserves space, content shown when modified */}
      <ModifiedToast visible={isModified} />

      {/* Top Banner */}
      <Banner
        degreeStatus={details!.degree_status}
        catalog={details!.catalog}
        includeInProgress={includeInProgress}
        onToggleInProgress={(val) => {
          setIncludeInProgress(val);
          if (!details) return;
          const updatedDetails: UserDetails = {
            ...details,
            degree_status: {
              ...details.degree_status,
              course_statuses: courseStatuses,
            },
            compute_in_progress: val,
            modified: true,
          };
          updateMutation.mutate(updatedDetails);
        }}
      />

      {/* 3 Tabs - centered, large text */}
      <div className="flex justify-center gap-8 border-b mt-6 px-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "pb-3 text-xl font-medium transition-colors relative",
              activeTab === tab.key
                ? "text-progress-active"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={{ fontSize: "22px" }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span
                className="absolute bottom-0 inset-x-0 h-[3px] rounded-t-full"
                style={{ backgroundColor: "var(--ui-progress-active)" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6 px-4">
        {activeTab === "requirements" && details && (
          <RequirementsPanel
            degreeStatus={details.degree_status}
            onIgnoreCourse={handleIgnoreCourse}
            includeInProgress={includeInProgress}
          />
        )}

        {activeTab === "semesters" && (
          <SemestersTab
            courseStatuses={courseStatuses}
            bankNames={bankNames}
            currentSemesterIdx={currentSemesterIdx}
            extraSemesters={extraSemesters}
            annotations={details?.timeline_annotations ?? {}}
            onSelectSemester={setCurrentSemester}
            onAddSemester={handleAddSemester}
            onDeleteSemester={handleDeleteSemester}
            onShiftSemestersFrom={handleShiftSemestersFrom}
            onSetAnnotations={handleSetAnnotations}
            onUpdateStatuses={handleUpdateStatuses}
            onDeleteCourse={handleDeleteCourse}
            onAddCourse={handleAddCourse}
          />
        )}

        {activeTab === "exemptions" && (
          <ExemptionsTab courseStatuses={courseStatuses} onAddCourse={handleAddCourse} onDeleteCourse={handleDeleteCourse} />
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
