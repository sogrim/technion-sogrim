import { LayoutDashboard, RefreshCw, AlertTriangle } from "lucide-react";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { OverviewSection } from "./sections/overview-section";
import { ActivitySection } from "./sections/activity-section";
import { PopulationSection } from "./sections/population-section";
import { FunnelSection } from "./sections/funnel-section";
import { AcademicSection } from "./sections/academic-section";

/** Admin BI dashboard: a single sectioned-scroll page fed by `GET
 *  /admins/stats`. Dark Datadog-style, RTL Hebrew, palette-driven charts. */
export function DashboardPage() {
  const { data, isLoading, isError, dataUpdatedAt } = useAdminStats();

  return (
    <div dir="rtl" className="mx-auto max-w-7xl space-y-8 pb-12">
      <DashboardHeader generatedAt={data?.generated_at} fetchedAt={dataUpdatedAt} loading={isLoading} />

      {isError && <ErrorState />}

      {isLoading && <LoadingState />}

      {data && !isError && (
        <div className="space-y-8">
          <OverviewSection data={data.overview} />
          <ActivitySection data={data.activity} />
          <PopulationSection data={data.population} />
          <FunnelSection data={data.funnel} />
          <AcademicSection data={data.academic} />
        </div>
      )}
    </div>
  );
}

function DashboardHeader({
  generatedAt,
  fetchedAt,
  loading,
}: {
  generatedAt?: string;
  fetchedAt?: number;
  loading: boolean;
}) {
  const updated = generatedAt ? new Date(generatedAt) : fetchedAt ? new Date(fetchedAt) : null;
  const updatedLabel = updated
    ? updated.toLocaleString("he-IL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })
    : null;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-1/15 text-chart-1">
          <LayoutDashboard className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-tight text-foreground">לוח בקרה</h1>
          <p className="text-sm text-muted-foreground">תובנות שימוש ונתונים אקדמיים</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
        {loading ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>טוען נתונים…</span>
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span>{updatedLabel ? `עודכן ${updatedLabel}` : "פעיל"}</span>
          </>
        )}
      </div>
    </header>
  );
}

function ErrorState() {
  return (
    <Card className="border-destructive/40">
      <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
        <span>טעינת נתוני לוח הבקרה נכשלה. נסו לרענן את העמוד.</span>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8" aria-busy="true">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      {/* Two chart rows */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
