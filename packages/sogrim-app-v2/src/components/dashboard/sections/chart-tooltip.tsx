import type { TooltipContentProps } from "recharts";

/** A theme-aware recharts tooltip: a small card matching the app surface,
 *  numbers localized he-IL, laid out RTL. Pass via `content={<ChartTooltip />}`.
 *  `unit` is appended to each value (e.g. "%"); `total` (when given) appends a
 *  share-of-population line. */
export function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: Partial<TooltipContentProps<number, string>> & { unit?: string }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      dir="rtl"
      className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md"
    >
      {label != null && label !== "" && (
        <p className="mb-1 font-medium text-popover-foreground">{String(label)}</p>
      )}
      <div className="space-y-0.5">
        {payload.map((entry, i) => {
          const value = typeof entry.value === "number" ? entry.value : Number(entry.value);
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: (entry.color as string) ?? "var(--chart-1)" }}
              />
              {entry.name != null && (
                <span className="text-muted-foreground">{String(entry.name)}</span>
              )}
              <span dir="ltr" className="font-semibold tabular-nums text-popover-foreground">
                {Number.isFinite(value) ? value.toLocaleString("he-IL") : "—"}
                {unit ?? ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
