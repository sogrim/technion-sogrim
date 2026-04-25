import { useState, useCallback } from "react";
import { useUserState } from "@/hooks/use-user-state";
import { useUpdateUserState } from "@/hooks/use-mutations";
import { useUiStore } from "@/stores/ui-store";
import { getAllSemesters, parseSemesterOrder } from "@/lib/semester-utils";
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
import type { CourseStatus, UserDetails } from "@/types/api";
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
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [activeTab, setActiveTab] = useState<PlannerTab>("requirements");
  const [includeInProgress, setIncludeInProgress] = useState(
    () => userState?.details?.compute_in_progress ?? false
  );
  const [extraSemesters, setExtraSemesters] = useState<string[]>([]);

  const details = userState?.details;
  const registrationState = getRegistrationState(details);

  const courseStatuses = details?.degree_status.course_statuses ?? [];
  const bankNames = details?.catalog?.course_bank_names ?? [];



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
    (courseNumber: string) => {
      const updatedStatuses = courseStatuses.filter(
        (cs) => cs.course._id !== courseNumber
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
    (semesterName: string) => {
      // Adding a semester is UI-only (no server call needed since no courses yet).
      // Track the new semester in extraSemesters so SemestersTab can render it.
      const existingSemesters = getAllSemesters(courseStatuses);
      if (!existingSemesters.includes(semesterName)) {
        setExtraSemesters((prev) =>
          prev.includes(semesterName) ? prev : [...prev, semesterName]
        );
      }
      // Compute tabs the same way SemestersTab does: merge courses + extras + new, sort by parseSemesterOrder
      const allTabs = Array.from(
        new Set([...existingSemesters, ...extraSemesters, semesterName])
      ).sort((a, b) => parseSemesterOrder(a) - parseSemesterOrder(b));

      const idx = allTabs.findIndex((t) => t === semesterName);
      if (idx >= 0) {
        setCurrentSemester(idx);
      }
    },
    [courseStatuses, extraSemesters, setCurrentSemester]
  );

  const handleDeleteSemester = useCallback(
    (semesterName: string) => {
      // Remove extra semester tracking
      setExtraSemesters((prev) => prev.filter((s) => s !== semesterName));

      // Filter out all courses belonging to this semester
      const semesterHasCourses = courseStatuses.some(
        (cs) => cs.semester === semesterName
      );
      if (semesterHasCourses) {
        const updatedStatuses = courseStatuses.filter(
          (cs) => cs.semester !== semesterName
        );
        sendUpdate(updatedStatuses);
      }

      // Move to previous tab
      if (currentSemesterIdx > 0) {
        setCurrentSemester(currentSemesterIdx - 1);
      }
    },
    [courseStatuses, currentSemesterIdx, sendUpdate, setCurrentSemester]
  );

  const handleIgnoreCourse = useCallback(
    (courseId: string, action: "לא רלוונטי" | "לא הושלם") => {
      const updatedStatuses = courseStatuses.map((cs) =>
        cs.course._id === courseId ? { ...cs, state: action, modified: true } : cs
      );
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
                ? "text-[#d66563]"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={{ fontSize: "22px" }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span
                className="absolute bottom-0 inset-x-0 h-[3px] rounded-t-full"
                style={{ backgroundColor: "#d66563" }}
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
            onSelectSemester={setCurrentSemester}
            onAddSemester={handleAddSemester}
            onDeleteSemester={handleDeleteSemester}
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
