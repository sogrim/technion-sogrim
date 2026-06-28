import * as React from "react";

/** A labeled section divider for the sectioned-scroll dashboard. Renders a
 *  small eyebrow index, the Hebrew title, and an optional caption, with a
 *  hairline rule that bleeds to the section edge (Datadog-style grouping). */
export function SectionHeading({
  index,
  title,
  caption,
  action,
}: {
  /** Two-digit section number (e.g. "01"); rendered LTR, monospace. */
  index: string;
  title: string;
  caption?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b border-border/60 pb-2">
      <div className="flex items-baseline gap-3">
        <span
          dir="ltr"
          className="font-mono text-xs font-semibold tabular-nums text-chart-1"
        >
          {index}
        </span>
        <div>
          <h2 className="text-lg font-bold leading-none text-foreground">{title}</h2>
          {caption && <p className="mt-1 text-xs text-muted-foreground">{caption}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
