import { Link, useParams } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { getResourceConfig } from "@/resources/registry";
import { useResourceRecord } from "@/hooks/use-resources";
import { AsyncBoundary } from "@/components/bo/async-boundary";
import { ResourceDetail } from "@/components/bo/resource-detail";
import { PageHeader } from "@/components/bo/page-header";
import { NotFoundView } from "@/components/bo/not-found";

export function ResourceDetailPage() {
  const params = useParams({ strict: false });
  const resource = params.resource ?? "";
  const id = params.id ?? "";
  const config = getResourceConfig(resource);
  const query = useResourceRecord(resource, id, Boolean(config));

  if (!config) {
    return <NotFoundView title="Unknown section" body={`There is no "${resource}" section.`} />;
  }

  const breadcrumb = (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/$resource" params={{ resource }} className="hover:text-foreground hover:underline">
        {config.label}
      </Link>
      <ChevronRight className="size-3.5 rtl:rotate-180" />
      <span className="text-foreground">{config.singular}</span>
    </nav>
  );

  return (
    <div className="space-y-5">
      <AsyncBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        loadingLabel={`Loading ${config.singular.toLowerCase()}…`}
      >
        {(record) => (
          <>
            <PageHeader
              breadcrumb={breadcrumb}
              title={config.getTitle(record)}
              subtitle={config.getSubtitle?.(record)}
              id={config.getId(record)}
            />
            <ResourceDetail record={record} />
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
