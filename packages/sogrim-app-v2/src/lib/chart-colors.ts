/** The categorical chart color tokens, in series order. Components pass these
 *  straight to recharts `fill`/`stroke` so charts recolor with the active
 *  palette + dark/light. Never hardcode hex in chart components — read from
 *  here (or `var(--chart-N)` directly). Defined per palette/theme in index.css. */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
] as const;

/** Pick a chart color by index, wrapping around the 6-color series. */
export function chartColor(index: number): string {
  return CHART_COLORS[((index % CHART_COLORS.length) + CHART_COLORS.length) % CHART_COLORS.length];
}
