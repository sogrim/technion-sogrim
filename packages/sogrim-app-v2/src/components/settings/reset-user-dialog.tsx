import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useUpdateUserState } from "@/hooks/use-mutations";
import { Button } from "@/components/ui/button";
import type { UserDetails } from "@/types/api";

const emptyDetails: UserDetails = {
  degree_status: {
    course_statuses: [],
    course_bank_requirements: [],
    overflow_msgs: [],
    total_credit: 0,
  },
  catalog: undefined,
  compute_in_progress: false,
  modified: false,
};

interface ResetUserDialogProps {
  open: boolean;
  onClose: () => void;
  onError?: (message: string) => void;
  onSuccess?: () => void;
}

export function ResetUserDialog({
  open,
  onClose,
  onError,
  onSuccess,
}: ResetUserDialogProps) {
  const [confirming, setConfirming] = useState(false);
  const updateUserState = useUpdateUserState();
  const navigate = useNavigate();

  function handleConfirm() {
    setConfirming(true);
    updateUserState.mutate(emptyDetails, {
      onSuccess: () => {
        setConfirming(false);
        onSuccess?.();
        onClose();
        navigate({ to: "/planner" });
      },
      onError: () => {
        setConfirming(false);
        onError?.("שגיאה באיפוס הנתונים. אנא נסה שוב.");
      },
    });
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={confirming ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg space-y-6">
          {/* Icon + Title */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">
              איפוס נתוני משתמש
            </h2>
          </div>

          {/* Warning text */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2 text-center">
            <p className="text-sm font-medium">
              האם אתה בטוח שברצונך לאפס את כל הנתונים?
            </p>
            <p className="text-sm text-muted-foreground">
              פעולה זו תמחק את כל הקורסים, הסמסטרים והסטטוס שלך.
              לא ניתן לבטל פעולה זו.
            </p>
          </div>

          {/* What will happen */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              מה יקרה:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>כל הקורסים שייבאת או הוספת ידנית יימחקו</li>
              <li>בחירת הקטלוג תתאפס</li>
              <li>סטטוס התואר יתאפס</li>
              <li>תועבר לתהליך ההרשמה מחדש</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={confirming}
            >
              ביטול
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleConfirm}
              disabled={confirming}
            >
              {confirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  מאפס...
                </>
              ) : (
                "אפס נתונים"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
