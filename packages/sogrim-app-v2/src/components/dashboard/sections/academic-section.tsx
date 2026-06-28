import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import type { AcademicStats } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartPanel } from "@/components/dashboard/chart-panel";
import { chartColor } from "@/lib/chart-colors";
import { SectionHeading } from "./section-heading";
import { ChartTooltip } from "./chart-tooltip";
import { num, pct } from "./format";

/** "<id> - <name>" when the name is known, else just the id. Keeps course rows
 *  informative even when the course cache hasn't resolved a name. */
function courseLabel(c: { course_id: string; course_name?: string }): string {
  const name = c.course_name?.trim();
  return name && name !== c.course_id ? `${c.course_id} - ${name}` : c.course_id;
}

export function AcademicSection({ data }: { data: AcademicStats }) {
  const topCourses = data.most_taken_courses.map((c) => ({
    label: courseLabel(c),
    value: c.count,
  }));

  return (
    <section>
      <SectionHeading
        index="05"
        title="תובנות אקדמיות"
        caption="מגמות קורסים, ציונים, ובנקי דרישות"
      />

      <div className="space-y-3">
        {/* Row 1: per-semester trend (full width) */}
        <ChartPanel
          title="קורסים נלקחו לפי סמסטר"
          description="ספירת קורסים על ציר הזמן האקדמי"
          height={260}
        >
          <AreaChart data={data.courses_per_semester} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id="semesterFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
            <XAxis
              dataKey="label"
              reversed
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              orientation="right"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              name="קורסים"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#semesterFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartPanel>

        {/* Row 2: top courses + GPA distribution */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ChartPanel
            title="הקורסים הנפוצים ביותר"
            description="לפי מספר הסטודנטים שלקחו"
            height={Math.max(280, topCourses.length * 24)}
          >
            <BarChart data={topCourses} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.4} />
              <XAxis
                type="number"
                reversed
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                orientation="right"
                width={220}
                tick={{ fontSize: 10, fill: "var(--foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }} content={<ChartTooltip />} />
              <Bar dataKey="value" name="סטודנטים" radius={[4, 0, 0, 4]} isAnimationActive={false}>
                {topCourses.map((entry, i) => (
                  <Cell key={entry.label} fill={chartColor(i % 6)} />
                ))}
              </Bar>
            </BarChart>
          </ChartPanel>

          <GpaDistribution data={data} />
        </div>

        {/* Row 3: hardest courses + bank completion */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <HardestCourses data={data} />
          <BankCompletion data={data} />
        </div>

        {/* Row 4: best / worst average courses */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <AvgCourseTable
            title="הקורסים עם הממוצע הגבוה ביותר"
            caption="ממוצע הציונים הגבוה ביותר (מינ׳ 5 ניגשים)"
            rows={data.best_average_courses}
          />
          <AvgCourseTable
            title="הקורסים עם הממוצע הנמוך ביותר"
            caption="ממוצע הציונים הנמוך ביותר (מינ׳ 5 ניגשים)"
            rows={data.worst_average_courses}
          />
        </div>
      </div>
    </section>
  );
}

/** A ranked course table showing the average grade (used for best/worst average). */
function AvgCourseTable({
  title,
  caption,
  rows,
}: {
  title: string;
  caption: string;
  rows: AcademicStats["best_average_courses"];
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs text-muted-foreground">
                <th className="py-1.5 pe-2 text-start font-medium">קורס</th>
                <th className="py-1.5 px-2 text-center font-medium">ממוצע</th>
                <th className="py-1.5 ps-2 text-center font-medium">ניגשים</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.course_id} className="border-b border-border/30 last:border-0">
                  <td className="py-1.5 pe-2">
                    <span className="block truncate font-medium text-foreground">
                      {courseLabel(c)}
                    </span>
                  </td>
                  <td dir="ltr" className="py-1.5 px-2 text-center font-semibold tabular-nums text-foreground">
                    {c.average_grade != null ? c.average_grade.toFixed(1) : "—"}
                  </td>
                  <td dir="ltr" className="py-1.5 ps-2 text-center tabular-nums text-muted-foreground">
                    {num(c.count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/** Student-GPA distribution. Numeric axis runs LTR (low -> high, 55 -> 100). */
function GpaDistribution({ data }: { data: AcademicStats }) {
  const buckets = data.gpa_distribution;
  return (
    <ChartPanel
      title="התפלגות ממוצע סטודנטים"
      description="נקודת מידע אחת לכל סטודנט (ממוצע משוקלל)"
      height={280}
    >
      <BarChart data={buckets} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
        {/* LTR numeric axis: ascending grade buckets left -> right. */}
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          orientation="left"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }} content={<ChartTooltip />} />
        <Bar dataKey="value" name="סטודנטים" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {buckets.map((entry, i) => (
            <Cell key={entry.label} fill={chartColor(i)} />
          ))}
        </Bar>
      </BarChart>
    </ChartPanel>
  );
}

/** Hardest courses: a ranked table (fail rate / avg grade / repeats). A table
 *  reads cleaner than a multi-metric chart for this. */
function HardestCourses({ data }: { data: AcademicStats }) {
  const rows = data.hardest_courses;
  return (
    <Card className="flex flex-col">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">הקורסים הקשים ביותר</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">לפי שיעור כישלון (מינ׳ 5 ניגשים)</p>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs text-muted-foreground">
                <th className="py-1.5 pe-2 text-start font-medium">קורס</th>
                <th className="py-1.5 px-2 text-center font-medium">% כישלון</th>
                <th className="py-1.5 px-2 text-center font-medium">ממוצע</th>
                <th className="py-1.5 ps-2 text-center font-medium">חזרות</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.course_id} className="border-b border-border/30 last:border-0">
                  <td className="py-1.5 pe-2">
                    <span className="block truncate font-medium text-foreground">
                      {courseLabel(c)}
                    </span>
                  </td>
                  <td dir="ltr" className="py-1.5 px-2 text-center tabular-nums">
                    <span className="font-semibold text-destructive">
                      {pct(c.fail_rate ?? 0)}
                    </span>
                  </td>
                  <td dir="ltr" className="py-1.5 px-2 text-center tabular-nums text-muted-foreground">
                    {c.average_grade != null ? c.average_grade.toFixed(1) : "—"}
                  </td>
                  <td dir="ltr" className="py-1.5 ps-2 text-center tabular-nums text-muted-foreground">
                    {num(c.times_repeated ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/** Requirement-bank completion — bottleneck banks first (lowest rate). */
function BankCompletion({ data }: { data: AcademicStats }) {
  const banks = data.bank_completion;
  return (
    <Card className="flex flex-col">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">השלמת בנקי דרישות</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">צווארי בקבוק ראשונים (שיעור השלמה נמוך)</p>
      </CardHeader>
      <CardContent className="space-y-2.5 p-4 pt-2">
        {banks.map((b, i) => {
          const ratePct = Math.round(b.completion_rate * 100);
          return (
            <div key={b.bank_name}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium text-foreground">{b.bank_name}</span>
                <span dir="ltr" className="flex items-center gap-2 tabular-nums">
                  <span className="font-semibold text-foreground">{ratePct}%</span>
                  <span className="text-xs text-muted-foreground">
                    {num(b.completed)}/{num(b.total)}
                  </span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="ms-auto h-full rounded-full"
                  style={{ width: `${Math.max(ratePct, 1)}%`, backgroundColor: chartColor(i) }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
