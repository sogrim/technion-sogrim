import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, Info } from "lucide-react";
import type { DegreeStatus, CourseBankReq } from "@/types/api";

interface MessagesPanelProps {
  degreeStatus: DegreeStatus;
}

function AccordionSection({
  title,
  icon,
  children,
  defaultOpen = false,
  count,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-right"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-foreground">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="rounded-full bg-[#d66563] px-2 py-0.5 text-xs text-white">
              {count}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="border-t px-4 pb-4 pt-3">{children}</div>}
    </div>
  );
}

export function MessagesPanel({ degreeStatus }: MessagesPanelProps) {
  const { overflow_msgs, course_bank_requirements } = degreeStatus;

  // Collect bank messages (warnings)
  const bankMessages: { bankName: string; message: string }[] = [];
  course_bank_requirements.forEach((bank: CourseBankReq) => {
    if (bank.message) {
      bankMessages.push({
        bankName: bank.course_bank_name,
        message: bank.message,
      });
    }
  });

  const hasOverflow = overflow_msgs.length > 0;
  const hasWarnings = bankMessages.length > 0;

  if (!hasOverflow && !hasWarnings) {
    return null;
  }

  return (
    <div className="space-y-3">
      {hasOverflow && (
        <AccordionSection
          title={"\u05D4\u05D5\u05D3\u05E2\u05D5\u05EA \u05D7\u05E9\u05D5\u05D1\u05D5\u05EA"}
          icon={<Info className="h-4 w-4 text-blue-500" />}
          defaultOpen={true}
          count={overflow_msgs.length}
        >
          <ul className="space-y-2">
            {overflow_msgs.map((msg, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                {msg}
              </li>
            ))}
          </ul>
        </AccordionSection>
      )}

      {hasWarnings && (
        <AccordionSection
          title={"\u05D0\u05D6\u05D4\u05E8\u05D5\u05EA"}
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          count={bankMessages.length}
        >
          <ul className="space-y-2">
            {bankMessages.map((item, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-foreground">
                  {item.bankName}:
                </span>{" "}
                <span className="text-foreground">{item.message}</span>
              </li>
            ))}
          </ul>
        </AccordionSection>
      )}
    </div>
  );
}
