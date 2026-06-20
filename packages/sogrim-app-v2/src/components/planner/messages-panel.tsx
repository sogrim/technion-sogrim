import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, Info } from "lucide-react";
import type { DegreeStatus } from "@/types/api";

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
            <span className="rounded-full bg-progress-active px-2 py-0.5 text-xs text-white">
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

const WARNING_PREFIX = "\u05D0\u05D6\u05D4\u05E8\u05D4";
const ERROR_PREFIX = "\u05E4\u05E1\u05D9\u05DC\u05D4";

export function MessagesPanel({ degreeStatus }: MessagesPanelProps) {
  const { overflow_msgs } = degreeStatus;

  const warnings: string[] = [];
  const importantMessages: string[] = [];

  overflow_msgs.forEach((msg) => {
    const trimmed = msg.trimStart();
    const matchedPrefix = [WARNING_PREFIX, ERROR_PREFIX].find((p) =>
      trimmed.startsWith(p)
    );
    if (matchedPrefix) {
      warnings.push(trimmed.slice(matchedPrefix.length).replace(/^[:\s]+/, ""));
    } else {
      importantMessages.push(msg);
    }
  });

  const hasWarnings = warnings.length > 0;
  const hasImportant = importantMessages.length > 0;

  if (!hasWarnings && !hasImportant) {
    return null;
  }

  const renderMessage = (msg: string, dotClass: string) => (
    <>
      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
      <span className="text-foreground">{msg}</span>
    </>
  );

  return (
    <div className="space-y-3">
      {hasImportant && (
        <AccordionSection
          title={"\u05D4\u05D5\u05D3\u05E2\u05D5\u05EA \u05D7\u05E9\u05D5\u05D1\u05D5\u05EA"}
          icon={<Info className="h-4 w-4 text-info" />}
          defaultOpen={true}
          count={importantMessages.length}
        >
          <ul className="space-y-2">
            {importantMessages.map((msg, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                {renderMessage(msg, "bg-info")}
              </li>
            ))}
          </ul>
        </AccordionSection>
      )}

      {hasWarnings && (
        <AccordionSection
          title={"\u05D0\u05D6\u05D4\u05E8\u05D5\u05EA"}
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          count={warnings.length}
        >
          <ul className="space-y-2">
            {warnings.map((msg, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                {renderMessage(msg, "bg-amber-500")}
              </li>
            ))}
          </ul>
        </AccordionSection>
      )}
    </div>
  );
}
