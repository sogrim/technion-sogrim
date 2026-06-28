import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  /** Hebrew label shown above the value (RTL). */
  label: string;
  /** The headline metric. Strings are rendered as-is; numbers are localized. */
  value: string | number;
  /** Optional period-over-period change. Positive renders green/up, negative
   *  red/down. `value` is a signed number; `label` is an optional caption
   *  (e.g. "מהשבוע שעבר"). Numeric axes / numbers render LTR. */
  delta?: { value: number; label?: string };
  /** Optional sparkline series (e.g. a small trend). Drawn LTR with --chart-1. */
  sparkline?: number[];
  /** Optional icon shown at the start of the card (e.g. a lucide icon). */
  icon?: React.ReactNode;
  className?: string;
}

function formatValue(value: string | number): string {
  return typeof value === "number" ? value.toLocaleString("he-IL") : value;
}

export function StatCard({ label, value, delta, sparkline, icon, className }: StatCardProps) {
  const deltaUp = delta ? delta.value >= 0 : false;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold leading-tight text-foreground" dir="ltr">
              {formatValue(value)}
            </p>
          </div>
          {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
        </div>

        {delta && (
          <div
            dir="ltr"
            className={cn(
              "mt-2 flex items-center gap-1 text-xs font-medium",
              deltaUp ? "text-success" : "text-destructive",
            )}
          >
            {deltaUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>
              {deltaUp ? "+" : ""}
              {delta.value.toLocaleString("he-IL")}
            </span>
            {delta.label && <span className="text-muted-foreground">{delta.label}</span>}
          </div>
        )}

        {sparkline && sparkline.length > 1 && (
          <div className="mt-3 h-10" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline.map((v, i) => ({ i, v }))}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
