import { useMemo } from "react";
import { BankRequirementCard } from "./bank-requirement-card";
import { MessagesPanel } from "../messages-panel";
import { ReservedCreditsPanel } from "../reserved-credits-panel";
import type { DegreeStatus } from "@/types/api";

interface RequirementsPanelProps {
  degreeStatus: DegreeStatus;
  onIgnoreCourse: (courseId: string, action: "לא רלוונטי" | "לא הושלם") => void;
  includeInProgress: boolean;
}

export function RequirementsPanel({ degreeStatus, onIgnoreCourse, includeInProgress }: RequirementsPanelProps) {
  const { course_bank_requirements, course_statuses } = degreeStatus;

  const sortedBanks = useMemo(
    () =>
      [...course_bank_requirements].sort(
        (a, b) => (b.credit_requirement ?? 0) - (a.credit_requirement ?? 0)
      ),
    [course_bank_requirements]
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row max-w-6xl mx-auto">
      {/* Left side: Bank requirements */}
      <div className="flex-1 min-w-0 space-y-3">
        <h3 className="text-lg font-bold text-foreground mb-4">
          {"\u05D3\u05E8\u05D9\u05E9\u05D5\u05EA \u05EA\u05D5\u05D0\u05E8"}
        </h3>
        {sortedBanks.map((bank) => (
          <BankRequirementCard
            key={bank.course_bank_name}
            bank={bank}
            courses={course_statuses}
            onIgnoreCourse={onIgnoreCourse}
            includeInProgress={includeInProgress}
          />
        ))}
      </div>

      {/* Right side: Messages */}
      <div className="w-full lg:w-80 shrink-0 space-y-3">
        <h3 className="text-lg font-bold text-foreground mb-4">
          {"\u05D4\u05D5\u05D3\u05E2\u05D5\u05EA"}
        </h3>
        <MessagesPanel degreeStatus={degreeStatus} />
        <ReservedCreditsPanel />
      </div>
    </div>
  );
}
