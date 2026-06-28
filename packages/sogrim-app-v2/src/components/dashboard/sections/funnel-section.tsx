import type { FunnelStats } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chartColor } from "@/lib/chart-colors";
import { SectionHeading } from "./section-heading";
import { num, pct } from "./format";

/** Onboarding funnel: signed in -> picked catalog -> imported grades ->
 *  computed status. Custom decreasing bars (RTL-anchored) with per-step
 *  drop-off vs. the previous step. */
export function FunnelSection({ data }: { data: FunnelStats }) {
  const steps = [
    { label: "נרשמו", value: data.signed_in },
    { label: "בחרו קטלוג", value: data.picked_catalog },
    { label: "ייבאו ציונים", value: data.imported_grades },
    { label: "חישבו תואר", value: data.computed_status },
  ];
  const top = steps[0].value || 1;

  return (
    <section>
      <SectionHeading
        index="04"
        title="משפך אונבורדינג"
        caption="מסע המשתמש מהרשמה ועד חישוב תואר, עם נשירה בכל שלב"
      />
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">שלבי האונבורדינג</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 p-4 pt-2">
          {steps.map((step, i) => {
            const widthPct = (step.value / top) * 100;
            const prev = i === 0 ? step.value : steps[i - 1].value;
            const dropoff = prev > 0 ? 1 - step.value / prev : 0;
            const ofTotal = top > 0 ? step.value / top : 0;
            return (
              <div key={step.label}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground">{step.label}</span>
                  <span dir="ltr" className="flex items-center gap-2 tabular-nums">
                    <span className="font-semibold text-foreground">{num(step.value)}</span>
                    <span className="text-xs text-muted-foreground">{pct(ofTotal)}</span>
                    {i > 0 && dropoff > 0 && (
                      <span className="text-xs font-medium text-destructive">
                        ▼ {pct(dropoff)}
                      </span>
                    )}
                  </span>
                </div>
                {/* RTL track: bar grows from the right (the reading start). */}
                <div className="h-7 w-full overflow-hidden rounded-md bg-muted">
                  <div
                    className="ms-auto h-full rounded-md transition-[width] duration-500"
                    style={{
                      width: `${Math.max(widthPct, 2)}%`,
                      backgroundColor: chartColor(i),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
