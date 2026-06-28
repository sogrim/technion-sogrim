import * as React from "react";
import { ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// The palette chart-color series lives in `@/lib/chart-colors` (CHART_COLORS,
// chartColor). Import it there; keeping it out of this file lets the component
// stay fast-refresh friendly.

export interface ChartPanelProps {
  /** Panel heading (Hebrew, RTL). */
  title: string;
  /** Optional caption under the title (e.g. a data-source proxy disclaimer). */
  description?: string;
  /** Optional trailing slot in the header (e.g. a legend or control). */
  action?: React.ReactNode;
  /** Height of the chart area in px. Defaults to 280. */
  height?: number;
  className?: string;
  /** A single recharts chart element (e.g. <BarChart>…</BarChart>). It is
   *  wrapped in a ResponsiveContainer so it fills the panel width. */
  children: React.ReactElement;
}

export function ChartPanel({
  title,
  description,
  action,
  height = 280,
  className,
  children,
}: ChartPanelProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {/* recharts lays out in LTR SVG coordinates and does NOT support CSS
            `dir=rtl` (it mis-positions axis labels). So the chart renders LTR and
            the RTL appearance comes from per-axis `reversed`/`orientation="right"`
            props. Hebrew tick/label text still renders correctly via Unicode bidi. */}
        <div style={{ height }} dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
