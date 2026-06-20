import { EM_DASH, formatScalar } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

interface FieldProps {
  label: string;
  value: unknown;
  /** Override the default scalar formatting. */
  format?: (value: unknown) => string;
  /** Show a copy button (hidden automatically for empty values). */
  copyable?: boolean;
  className?: string;
}

/** A single read-only labelled value (label above, value below). */
export function Field({ label, value, format, copyable, className }: FieldProps) {
  const display = format ? format(value) : formatScalar(value);
  const empty = display === EM_DASH;

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className={cn("text-sm break-words", empty && "text-muted-foreground")}>
          {display}
        </span>
        {copyable && !empty && <CopyButton value={display} className="size-6" />}
      </div>
    </div>
  );
}
