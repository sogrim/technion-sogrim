import { Users, Activity, Zap, GraduationCap, FileUp, CheckCircle2 } from "lucide-react";
import type { OverviewStats } from "@/types/api";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionHeading } from "./section-heading";
import { pct } from "./format";

/** Overview KPI strip. Activity counts derive from `last_seen` (login-only,
 *  hourly-throttled) — point-in-time, not engagement-per-action. */
export function OverviewSection({ data }: { data: OverviewStats }) {
  const total = data.total_users;
  const onboardedPct = total > 0 ? pct(data.onboarded / total) : "0%";
  const importedPct = total > 0 ? pct(data.imported_grades / total) : "0%";
  const computedPct = total > 0 ? pct(data.computed_status / total) : "0%";

  return (
    <section>
      <SectionHeading
        index="01"
        title="סקירה כללית"
        caption="מדדי ליבה — פעילות נגזרת מהתחברות אחרונה (לא פעולה־לפי־פעולה)"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="סך הכל משתמשים"
          value={total}
          icon={<Users className="h-4 w-4" />}
          className="col-span-2 sm:col-span-1"
        />
        <StatCard label="פעילים היום" value={data.dau} icon={<Activity className="h-4 w-4" />} />
        <StatCard label="פעילים השבוע" value={data.wau} icon={<Activity className="h-4 w-4" />} />
        <StatCard label="פעילים החודש" value={data.mau} icon={<Activity className="h-4 w-4" />} />
        <StatCard
          label="דביקות (DAU/MAU)"
          value={pct(data.stickiness)}
          icon={<Zap className="h-4 w-4" />}
        />
        <StatCard
          label="השלימו אונבורדינג"
          value={onboardedPct}
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <StatCard label="ייבאו ציונים" value={importedPct} icon={<FileUp className="h-4 w-4" />} />
        <StatCard
          label="חישבו תואר"
          value={computedPct}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>
    </section>
  );
}
