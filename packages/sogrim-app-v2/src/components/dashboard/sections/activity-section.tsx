import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { ActivityStats } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartPanel } from "@/components/dashboard/chart-panel";
import { chartColor } from "@/lib/chart-colors";
import { SectionHeading } from "./section-heading";
import { ChartTooltip } from "./chart-tooltip";
import { num } from "./format";

const DAY_LABELS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

/** Activity recency donut + a day×hour proxy heatmap. The heatmap is a proxy:
 *  it bins each user's single `last_seen` timestamp, not every session. */
export function ActivitySection({ data }: { data: ActivityStats }) {
  const recency = [
    { label: "פעילים (עד 7 ימים)", value: data.active, color: chartColor(2) },
    { label: "רדומים (7–30 ימים)", value: data.dormant, color: chartColor(3) },
    { label: "לא פעילים (30 ימים+)", value: data.inactive, color: chartColor(4) },
  ];
  const recencyTotal = recency.reduce((s, r) => s + r.value, 0);

  // Flatten the 7×24 matrix to find the max for color intensity scaling.
  // Guard against a missing/mis-shaped payload so the panel degrades to empty
  // instead of crashing the whole dashboard.
  const heatmap = Array.isArray(data.last_active_heatmap) ? data.last_active_heatmap : [];
  let maxCell = 0;
  for (const row of heatmap) for (const cell of row) if (cell > maxCell) maxCell = cell;

  return (
    <section>
      <SectionHeading
        index="02"
        title="פעילות"
        caption="חלוקת ותק־פעילות + מפת חום יום×שעה (פרוקסי מבוסס התחברות אחרונה, שעון ישראל)"
      />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ChartPanel
          title="ותק פעילות"
          description={`${num(recencyTotal)} משתמשים, לפי התחברות אחרונה`}
          height={260}
        >
          <PieChart>
            <Pie
              data={recency}
              dataKey="value"
              nameKey="label"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {recency.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: 12, direction: "rtl" }}
            />
          </PieChart>
        </ChartPanel>

        <Card className="flex flex-col lg:col-span-2">
          <Heatmap matrix={heatmap} maxCell={maxCell} />
        </Card>
      </div>
    </section>
  );
}

/** A 7-row (Sun..Sat) × 24-col (hour) heatmap rendered as a CSS grid. Cell
 *  intensity scales the --chart-1 token via opacity so it tracks the palette.
 *  Hovering a cell surfaces its value in the header (no per-cell tooltips). */
function Heatmap({ matrix, maxCell }: { matrix: number[][]; maxCell: number }) {
  const [hover, setHover] = useState<{ day: number; hour: number; count: number } | null>(null);

  return (
    <>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div>
          <CardTitle className="text-base">מפת חום: יום × שעה</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            פרוקסי — נגזר מהחותם היחיד של התחברות אחרונה לכל משתמש (שעון ישראל)
          </p>
        </div>
        <div
          dir="ltr"
          className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs tabular-nums text-muted-foreground"
        >
          {hover
            ? `${DAY_LABELS[hover.day]} · ${String(hover.hour).padStart(2, "0")}:00 — ${hover.count.toLocaleString("he-IL")}`
            : "רחפו לפרטים"}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div dir="ltr" className="overflow-x-auto">
          <div className="min-w-[520px]">
            {/* Hour ruler (LTR numeric) */}
            <div className="mb-1 grid grid-cols-[2rem_repeat(24,1fr)] gap-px">
              <span />
              {Array.from({ length: 24 }, (_, h) => (
                <span
                  key={h}
                  className="text-center text-[9px] tabular-nums text-muted-foreground"
                >
                  {h % 3 === 0 ? h : ""}
                </span>
              ))}
            </div>
            {matrix.map((row, day) => (
              <div key={day} className="mb-px grid grid-cols-[2rem_repeat(24,1fr)] gap-px">
                <span className="flex items-center justify-end pr-1 text-[10px] text-muted-foreground">
                  {DAY_LABELS[day]}
                </span>
                {row.map((count, hour) => {
                  const intensity = maxCell > 0 ? count / maxCell : 0;
                  // Floor the opacity so any non-zero cell is visible.
                  const opacity = count === 0 ? 0.4 : 0.18 + intensity * 0.82;
                  return (
                    <div
                      key={hour}
                      role="img"
                      aria-label={`${DAY_LABELS[day]} ${hour}:00 — ${count.toLocaleString("he-IL")}`}
                      onMouseEnter={() => setHover({ day, hour, count })}
                      onMouseLeave={() => setHover(null)}
                      className="aspect-square rounded-[2px] border border-border/40 transition-opacity hover:!opacity-100 hover:ring-1 hover:ring-chart-1"
                      style={{
                        backgroundColor: count === 0 ? "var(--muted)" : "var(--chart-1)",
                        opacity,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </>
  );
}
