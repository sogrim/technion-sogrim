import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from "recharts";
import { FACULTY_LABELS, type Faculty, type PopulationStats } from "@/types/api";
import { ChartPanel } from "@/components/dashboard/chart-panel";
import { chartColor } from "@/lib/chart-colors";
import { SectionHeading } from "./section-heading";
import { ChartTooltip } from "./chart-tooltip";

/** Map the backend faculty labels to Hebrew. The "no catalog" sentinels
 *  (Unknown/None/empty) get the onboarding wording; real faculties go through
 *  the shared FACULTY_LABELS map (e.g. "ComputerScience" -> "מדעי המחשב"). */
function normalizeFacultyLabel(label: string): string {
  if (label === "Unknown" || label === "None" || label === "") return "ללא קטלוג";
  return FACULTY_LABELS[label as Faculty] ?? label;
}

export function PopulationSection({ data }: { data: PopulationStats }) {
  const faculty = data.by_faculty
    .map((b) => ({ label: normalizeFacultyLabel(b.label), value: b.value }))
    .sort((a, b) => b.value - a.value);

  const adoption = data.adoption;

  // The "no catalog" / "no year" sentinels aren't real tracks/years — drop them
  // from these breakdowns (the no-catalog population is already the "ללא קטלוג"
  // bucket in the faculty chart above).
  const isSentinel = (label: string) =>
    label === "None" || label === "Unknown" || label === "";

  // Top tracks by user count (catalog names can be long, so cap the list).
  const byCatalog = data.by_catalog
    .filter((b) => !isSentinel(b.label))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  // Real catalog years, ascending.
  const byCatalogYear = data.by_catalog_year
    .filter((b) => !isSentinel(b.label))
    .sort((a, b) => Number(a.label) - Number(b.label));

  return (
    <section>
      <SectionHeading
        index="03"
        title="אוכלוסייה"
        caption="פילוח לפי פקולטה ואימוץ פיצ׳רים"
      />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ChartPanel
          title="משתמשים לפי פקולטה"
          description="כולל קטגוריית ׳ללא קטלוג׳ (טרם בחרו מסלול)"
          height={Math.max(260, faculty.length * 28)}
          className="lg:col-span-2"
        >
          <BarChart data={faculty} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.4} />
            <XAxis
              type="number"
              orientation="bottom"
              reversed
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              orientation="right"
              width={170}
              tick={{ fontSize: 11, fill: "var(--foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }} content={<ChartTooltip />} />
            <Bar dataKey="value" name="משתמשים" radius={[4, 0, 0, 4]} isAnimationActive={false}>
              {faculty.map((entry, i) => (
                <Cell
                  key={entry.label}
                  fill={entry.label === "ללא קטלוג" ? "var(--muted-foreground)" : chartColor(i)}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartPanel>

        <ChartPanel title="אימוץ פיצ׳רים" description="מצב כהה, פלטה מותאמת, מערכת שעות" height={260}>
          <BarChart data={adoption} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--foreground)" }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              orientation="right"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }} content={<ChartTooltip />} />
            <Bar dataKey="value" name="משתמשים" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {adoption.map((entry, i) => (
                <Cell key={entry.label} fill={chartColor(i + 1)} />
              ))}
            </Bar>
          </BarChart>
        </ChartPanel>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartPanel
          title="לפי מסלול (קטלוג)"
          description="המסלולים הנפוצים ביותר"
          height={Math.max(260, byCatalog.length * 26)}
        >
          <BarChart data={byCatalog} layout="vertical" margin={{ left: 8, right: 16 }}>
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
              width={210}
              tick={{ fontSize: 10, fill: "var(--foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }} content={<ChartTooltip />} />
            <Bar dataKey="value" name="משתמשים" radius={[4, 0, 0, 4]} isAnimationActive={false}>
              {byCatalog.map((entry, i) => (
                <Cell key={entry.label} fill={chartColor(i)} />
              ))}
            </Bar>
          </BarChart>
        </ChartPanel>

        <ChartPanel title="לפי שנת קטלוג" description="התפלגות לפי שנת הקטלוג" height={260}>
          <BarChart data={byCatalogYear} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--foreground)" }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              orientation="right"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }} content={<ChartTooltip />} />
            <Bar dataKey="value" name="משתמשים" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {byCatalogYear.map((entry, i) => (
                <Cell key={entry.label} fill={chartColor(i + 2)} />
              ))}
            </Bar>
          </BarChart>
        </ChartPanel>
      </div>
    </section>
  );
}
