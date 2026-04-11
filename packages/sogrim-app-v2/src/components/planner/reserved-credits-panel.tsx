import { useMemo, useState, useCallback } from "react";
import {
  Minus,
  Plus,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useUserState } from "@/hooks/use-user-state";
import { useUpdateUserState } from "@/hooks/use-mutations";
import {
  getTotalReservedCredits,
  getAllocatedReservedCredits,
  getTotalAllocatedReservedCredits,
  setReservedCredits,
} from "@/lib/reserved-credits";
import type { UserDetails } from "@/types/api";

const CREDIT_STEP = 0.5;

function CreditInput({
  value,
  onChange,
  isOverAllocated,
}: {
  value: number;
  onChange: (v: number) => void;
  isOverAllocated: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEdit = useCallback(() => {
    setDraft(String(value));
    setEditing(true);
  }, [value]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed >= 0) {
      const rounded = Math.round(parsed * 2) / 2;
      onChange(rounded);
    }
  }, [draft, onChange]);

  if (editing) {
    return (
      <input
        type="number"
        step="0.5"
        min="0"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitEdit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-12 h-7 text-center text-sm font-bold border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={startEdit}
      className={`w-9 h-7 flex items-center justify-center text-sm font-bold rounded border cursor-text transition-colors hover:border-primary ${
        isOverAllocated && value > 0
          ? "text-destructive border-destructive/40"
          : "text-foreground border-border"
      }`}
      title="לחץ לעריכה"
    >
      {value}
    </button>
  );
}

export function ReservedCreditsPanel() {
  const { data: userState } = useUserState();
  const updateMutation = useUpdateUserState();
  const [open, setOpen] = useState(true);

  const details = userState?.details;
  const courseStatuses = details?.degree_status.course_statuses ?? [];
  const bankNames = details?.catalog?.course_bank_names ?? [];

  const totalAvailable = useMemo(
    () => getTotalReservedCredits(courseStatuses),
    [courseStatuses],
  );
  const allocatedMap = useMemo(
    () => getAllocatedReservedCredits(courseStatuses),
    [courseStatuses],
  );
  const totalAllocated = useMemo(
    () => getTotalAllocatedReservedCredits(courseStatuses),
    [courseStatuses],
  );

  const remaining = totalAvailable - totalAllocated;
  const isOverAllocated = remaining < 0;

  const mutate = useCallback(
    (updatedStatuses: typeof courseStatuses) => {
      if (!details) return;
      const updatedDetails: UserDetails = {
        ...details,
        degree_status: {
          ...details.degree_status,
          course_statuses: updatedStatuses,
        },
        modified: true,
      };
      updateMutation.mutate(updatedDetails);
    },
    [details, updateMutation],
  );

  const handleDelta = useCallback(
    (bankName: string, delta: number) => {
      const current = allocatedMap.get(bankName) ?? 0;
      mutate(setReservedCredits(courseStatuses, bankName, current + delta));
    },
    [courseStatuses, allocatedMap, mutate],
  );

  const handleSet = useCallback(
    (bankName: string, credits: number) => {
      mutate(setReservedCredits(courseStatuses, bankName, credits));
    },
    [courseStatuses, mutate],
  );

  if (totalAvailable <= 0) return null;

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-right"
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-foreground">
            {"הקצאת נקודות מילואים"}
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t p-4 space-y-3">
          {/* Remaining credits countdown */}
          <div className="flex items-center justify-between text-sm">
            <span
              className={`font-medium ${isOverAllocated ? "text-destructive" : "text-foreground"}`}
            >
              {"נקודות מילואים שלא נוצלו: "}
              {remaining}
              {" נקודות"}
            </span>
          </div>

          {isOverAllocated && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{"הוקצו יותר נקודות מילואים ממה שאותר במערכת"}</span>
            </div>
          )}

          {/* Bank rows */}
          <div className="space-y-1.5">
            {bankNames.map((bankName) => {
              const allocated = allocatedMap.get(bankName) ?? 0;
              return (
                <div
                  key={bankName}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="text-sm text-foreground truncate flex-1">
                    {bankName}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelta(bankName, CREDIT_STEP)}
                      className="w-7 h-7 flex items-center justify-center rounded border text-muted-foreground hover:text-foreground hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title={"הוסף נקודות"}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <CreditInput
                      value={allocated}
                      onChange={(v) => handleSet(bankName, v)}
                      isOverAllocated={isOverAllocated}
                    />
                    <button
                      onClick={() => handleDelta(bankName, -CREDIT_STEP)}
                      disabled={allocated <= 0}
                      className="w-7 h-7 flex items-center justify-center rounded border text-muted-foreground hover:text-foreground hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title={'הפחת נק"ז'}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
