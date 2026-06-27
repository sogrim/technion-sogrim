import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useTimetableStore } from "@/stores/timetable-store";
import { useProviderUpdates } from "@/hooks/use-api-provider";
import { useUserState } from "@/hooks/use-user-state";
import {
  useUpdateUserState,
  useComputeDegreeStatus,
} from "@/hooks/use-mutations";
import { useUiStore } from "@/stores/ui-store";
import { getProvider } from "@/data/course-schedule-provider";
import { Toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import {
  formatSemesterName,
  getAllSemesters,
  semestersEqual,
} from "@/lib/semester-utils";
import { cn } from "@/lib/utils";
import type { AcademicSemester, CourseStatus, UserDetails } from "@/types/api";

type ToastAction = { label: string; onClick: () => void };
type ToastState = {
  message: string;
  type: "error" | "success";
  action?: ToastAction;
} | null;

function buildStatusFromCourse(
  course: { id: string; name: string; credit: number },
  semester: AcademicSemester,
): CourseStatus {
  return {
    course: {
      _id: course.id,
      name: course.name,
      credit: course.credit,
    },
    grade: undefined,
    semester,
    state: "בתהליך",
    type: undefined,
    modified: true,
    times_repeated: 0,
  };
}

export function SyncToSemestersButton() {
  const navigate = useNavigate();
  const setCurrentSemester = useUiStore((s) => s.setCurrentSemester);

  const drafts = useTimetableStore((s) => s.drafts);
  const activeDraftId = useTimetableStore((s) => s.activeDraftId);
  const currentSemester = useTimetableStore((s) => s.currentSemester);

  const { data: userState, isLoading: userLoading } = useUserState();
  const updateMutation = useUpdateUserState();
  const computeMutation = useComputeDegreeStatus();

  // Re-evaluate when the schedule provider has loaded more courses so we
  // can transition from "skipping unresolved" to "fully resolvable".
  useProviderUpdates();

  const [toast, setToast] = useState<ToastState>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const activeDraft = useMemo(
    () => drafts.find((d) => d.id === activeDraftId),
    [drafts, activeDraftId],
  );

  const draftSemester = activeDraft?.semester ?? currentSemester ?? null;
  const draftCourseIds = useMemo(
    () => activeDraft?.courses.map((c) => c.courseId) ?? [],
    [activeDraft],
  );

  const existingStatuses = useMemo(
    () => userState?.details?.degree_status.course_statuses ?? [],
    [userState],
  );

  // Courses already present in the planner for the draft's semester.
  const existingForSemester = useMemo(() => {
    if (!draftSemester) return [];
    return existingStatuses.filter((cs) =>
      semestersEqual(cs.semester, draftSemester),
    );
  }, [existingStatuses, draftSemester]);

  // Locked: at least one course in this planner semester has been
  // promoted out of "בתהליך" (i.e. graded, marked complete, etc.).
  // We won't risk mutating a semester the user is actively editing.
  const lockedByEdits = useMemo(
    () => existingForSemester.some((cs) => cs.state !== "בתהליך"),
    [existingForSemester],
  );

  // Smart-merge candidates: timetable courses for this semester that
  // resolve via the schedule provider and aren't already in the planner.
  const coursesToAdd = useMemo(() => {
    if (!draftSemester || lockedByEdits) return [];
    const provider = getProvider();
    const existingIds = new Set(existingForSemester.map((cs) => cs.course._id));
    const result: { id: string; name: string; credit: number }[] = [];
    for (const courseId of draftCourseIds) {
      if (existingIds.has(courseId)) continue;
      const course = provider.getCourse(courseId);
      if (!course) continue;
      result.push({ id: course.id, name: course.name, credit: course.credit });
      existingIds.add(course.id); // de-dupe within the draft itself
    }
    return result;
  }, [draftSemester, draftCourseIds, existingForSemester, lockedByEdits]);

  // Removal candidates: planner entries for this semester whose course
  // is no longer in the active draft. Only considered when not locked.
  const coursesToRemove = useMemo(() => {
    if (!draftSemester || lockedByEdits) return [];
    const draftIdSet = new Set(draftCourseIds);
    return existingForSemester.filter((cs) => !draftIdSet.has(cs.course._id));
  }, [draftSemester, draftCourseIds, existingForSemester, lockedByEdits]);

  // Single disabled-reason computation — drives both the disabled attribute
  // and the tooltip text. Keep these in Hebrew to match the rest of the UI.
  const disabledReason: string | null = (() => {
    if (userLoading || !userState?.details) {
      return "טוען נתונים...";
    }
    if (!draftSemester) {
      return "יש לבחור סמסטר";
    }
    if (!activeDraft) {
      return "אין מערכת שעות פעילה לסנכרן.";
    }
    if (draftCourseIds.length === 0) {
      return "מערכת השעות ריקה.";
    }
    if (lockedByEdits) {
      const name = formatSemesterName(draftSemester);
      return `הסמסטר "${name}" כבר קיים בעמוד הסמסטרים. כדי לסנכרן את כל הקורסים לסמסטר חדש, יש למחוק תחילה את הסמסטר הקיים.`;
    }
    if (coursesToAdd.length === 0 && coursesToRemove.length === 0) {
      const name = formatSemesterName(draftSemester);
      return `כל הקורסים כבר קיימים בסמסטר "${name}" - אין מה לסנכרן.`;
    }
    return null;
  })();

  const isDisabled = disabledReason !== null || updateMutation.isPending;

  const enabledTooltip = (() => {
    if (!draftSemester) {
      return "סנכרן את הקורסים במערכת השעות לסמסטר בעמוד הסמסטרים.";
    }
    const name = formatSemesterName(draftSemester);
    if (coursesToRemove.length === 0) {
      return `סנכרן ${coursesToAdd.length} קורסים חדשים לסמסטר "${name}" בעמוד הסמסטרים.`;
    }
    const parts: string[] = [];
    if (coursesToAdd.length > 0) parts.push(`${coursesToAdd.length} קורסים יתווספו`);
    parts.push(`${coursesToRemove.length} קורסים יוסרו`);
    return `עדכן את הסמסטר "${name}" (${parts.join(", ")}).`;
  })();

  const tooltip = disabledReason ?? enabledTooltip;

  const goToSyncedSemester = useCallback(
    (semester: AcademicSemester, statusesIncludingNew: CourseStatus[]) => {
      const allSemesters = getAllSemesters(statusesIncludingNew);
      const idx = allSemesters.findIndex((s) => semestersEqual(s, semester));
      setCurrentSemester(
        idx >= 0 ? idx : Math.max(0, allSemesters.length - 1),
      );
      navigate({ to: "/planner", search: { tab: "semesters" } });
    },
    [navigate, setCurrentSemester],
  );

  /**
   * Build the updated CourseStatus[] and PUT it. Called both from the
   * silent add-only path and from the dialog's confirm action.
   */
  const runMutation = useCallback(() => {
    if (!activeDraft || !draftSemester || !userState?.details) return;
    const details = userState.details;

    const newStatuses = coursesToAdd.map((c) =>
      buildStatusFromCourse(c, draftSemester),
    );
    const removeIds = new Set(coursesToRemove.map((cs) => cs.course._id));

    // Remove only entries for *this* semester. Other semesters untouched.
    const trimmed = existingStatuses.filter(
      (cs) =>
        !(
          semestersEqual(cs.semester, draftSemester) &&
          removeIds.has(cs.course._id)
        ),
    );
    const updatedStatuses = [...trimmed, ...newStatuses];

    const updatedDetails: UserDetails = {
      ...details,
      degree_status: {
        ...details.degree_status,
        course_statuses: updatedStatuses,
      },
      modified: true,
    };

    updateMutation.mutate(updatedDetails, {
      onSuccess: () => {
        // Refresh bank requirements in the background so the planner's
        // computed values stay current; the user doesn't wait on this.
        computeMutation.mutate();
        setConfirmOpen(false);

        const semName = formatSemesterName(draftSemester);
        const addedN = newStatuses.length;
        const removedN = removeIds.size;
        let message: string;
        if (addedN > 0 && removedN > 0) {
          message = `הסמסטר "${semName}" עודכן: נוספו ${addedN}, הוסרו ${removedN}.`;
        } else if (removedN > 0) {
          message = `הוסרו ${removedN} קורסים מהסמסטר "${semName}".`;
        } else {
          message = `נוספו ${addedN} קורסים לסמסטר "${semName}".`;
        }

        setToast({
          message,
          type: "success",
          action: {
            label: "עבור לסמסטר.",
            onClick: () => goToSyncedSemester(draftSemester, updatedStatuses),
          },
        });
      },
      onError: (err) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const serverMsg = (err as { response?: { data?: string } })?.response
          ?.data;
        setToast({
          message: serverMsg
            ? `שגיאה בסנכרון: ${serverMsg}`
            : `שגיאה בסנכרון: ${errorMsg}`,
          type: "error",
        });
      },
    });
  }, [
    activeDraft,
    draftSemester,
    userState,
    existingStatuses,
    coursesToAdd,
    coursesToRemove,
    updateMutation,
    computeMutation,
    goToSyncedSemester,
  ]);

  function handleClick() {
    if (isDisabled) return;
    // Pure add → silent sync. Any removals → confirm first.
    if (coursesToRemove.length === 0) {
      runMutation();
    } else {
      setConfirmOpen(true);
    }
  }

  const draftSemesterName = draftSemester ? formatSemesterName(draftSemester) : "";

  return (
    <>
      <Hint label={tooltip}>
        {/* span trigger so the tooltip still shows when the button is disabled */}
        <span className="inline-flex">
          <button
            type="button"
            onClick={handleClick}
            disabled={isDisabled}
            aria-label={tooltip}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-foreground",
            )}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">סנכרן לסמסטרים</span>
          </button>
        </span>
      </Hint>

      {/* Confirmation dialog — only when removals are involved.
          Inline modal matches the ResetUserDialog pattern. */}
      {confirmOpen && coursesToRemove.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={updateMutation.isPending ? undefined : () => setConfirmOpen(false)}
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            dir="rtl"
          >
            <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <h2 className="text-lg font-bold">
                  {`עדכון סמסטר "${draftSemesterName}"`}
                </h2>
              </div>

              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                <p className="text-sm font-medium">
                  הקורסים הבאים יוסרו מהסמסטר:
                </p>
                <ul className="text-sm space-y-1 max-h-48 overflow-y-auto pr-1">
                  {coursesToRemove.map((cs) => (
                    <li key={cs.course._id} className="flex justify-between gap-2">
                      <span className="truncate">{cs.course.name}</span>
                      <span
                        className="shrink-0 text-muted-foreground tabular-nums"
                        dir="ltr"
                      >
                        {cs.course._id}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {coursesToAdd.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  {`בנוסף, יתווספו ${coursesToAdd.length} קורסים חדשים.`}
                </p>
              )}

              <p className="text-sm text-muted-foreground text-center">
                לחיצה על אישור תעדכן את הסמסטר. האם להמשיך?
              </p>

              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  ביטול
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={runMutation}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      מעדכן...
                    </>
                  ) : (
                    "אשר והסר"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
