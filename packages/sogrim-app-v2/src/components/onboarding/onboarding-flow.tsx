import { useState, useEffect } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useComputeDegreeStatus } from "@/hooks/use-mutations";
import { cn } from "@/lib/utils";
import { Toast } from "@/components/ui/toast";
import { FacultyStep } from "./faculty-step";
import { CatalogStep } from "./catalog-step";
import { CoursesStep } from "./courses-step";
import type { Faculty } from "@/types/api";

type OnboardingStep = "faculty" | "catalog" | "courses" | "computing";

interface OnboardingFlowProps {
  currentStep: "catalog" | "courses" | "computing";
}

const STEP_ORDER: OnboardingStep[] = [
  "faculty",
  "catalog",
  "courses",
  "computing",
];

const STEP_LABELS: { key: OnboardingStep; label: string }[] = [
  { key: "faculty", label: "בחירת פקולטה" },
  { key: "catalog", label: "בחירת מסלול" },
  { key: "courses", label: "ייבוא קורסים" },
  { key: "computing", label: "חישוב סטטוס" },
];

function StepIndicator({
  currentStep,
}: {
  currentStep: OnboardingStep;
}) {
  const currentIdx = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEP_LABELS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={cn(
                  "text-sm hidden sm:inline",
                  isCurrent
                    ? "font-medium"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  "h-[2px] w-8 sm:w-12",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function WelcomeHeader() {
  return (
    <div className="text-center space-y-2 mb-6">
      <h1 className="text-3xl font-bold">
        ברוכים הבאים לסוגרים
      </h1>
      <p className="text-muted-foreground max-w-lg mx-auto">
        נעזור לך לעקוב אחרי ההתקדמות שלך לקראת סיום התואר.
        בואו נתחיל בכמה שלבים קצרים.
      </p>
    </div>
  );
}

function ComputingStep() {
  const computeMutation = useComputeDegreeStatus();

  useEffect(() => {
    if (
      !computeMutation.isPending &&
      !computeMutation.isSuccess &&
      !computeMutation.isError
    ) {
      computeMutation.mutate();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">מחשב סטטוס תואר...</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          המערכת מחשבת את סטטוס השלמת התואר שלך. זה עשוי לקחת מספר
          שניות.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="space-y-3 w-full max-w-sm">
          {[
            "טוען נתוני קטלוג...",
            "מנתח גיליון ציונים...",
            "מחשב דרישות תואר...",
          ].map((text, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm animate-pulse"
              style={{ animationDelay: `${idx * 300}ms` }}
            >
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              <span className="text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OnboardingFlow({ currentStep }: OnboardingFlowProps) {
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(
    null
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  // Compute step triggers auto-compute; also allow skipping from courses
  const computeMutation = useComputeDegreeStatus();

  // When the external step is "catalog" we start at the faculty sub-step.
  // When external step is "courses" or "computing" we jump directly.
  const internalStep: OnboardingStep =
    currentStep === "catalog" && !selectedFaculty
      ? "faculty"
      : currentStep === "catalog" && selectedFaculty
        ? "catalog"
        : currentStep;

  function handleFacultySelect(faculty: Faculty) {
    setSelectedFaculty(faculty);
  }

  function handleBackToFaculty() {
    setSelectedFaculty(null);
  }

  function handleError(message: string) {
    setToast({ message, type: "error" });
  }

  function handleSkipCourses() {
    // Skip grade import -- trigger compute directly so user sees their planner
    computeMutation.mutate(undefined, {
      onError: () => {
        handleError("שגיאה בחישוב סטטוס התואר. נסה לרענן את הדף.");
      },
    });
  }

  const showWelcome = internalStep === "faculty";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {showWelcome && <WelcomeHeader />}

      <StepIndicator currentStep={internalStep} />

      {internalStep === "faculty" && (
        <FacultyStep onSelect={handleFacultySelect} />
      )}

      {internalStep === "catalog" && selectedFaculty && (
        <CatalogStep
          faculty={selectedFaculty}
          onBack={handleBackToFaculty}
          onError={handleError}
        />
      )}

      {internalStep === "courses" && (
        <div className="space-y-4">
          <CoursesStep
            onError={handleError}
            showSkip
            onSkip={handleSkipCourses}
          />
          {/* Back to catalog not available here since catalog is server-persisted;
              user can change catalog in settings after onboarding. */}
        </div>
      )}

      {internalStep === "computing" && <ComputingStep />}

      {/* Step counter text */}
      <div className="text-center mt-6">
        <p className="text-xs text-muted-foreground">
          שלב {STEP_ORDER.indexOf(internalStep) + 1} מתוך {STEP_ORDER.length}
        </p>
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
