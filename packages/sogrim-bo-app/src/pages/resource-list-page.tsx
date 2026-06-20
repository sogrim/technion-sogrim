import { useNavigate, useParams } from "@tanstack/react-router";
import { getResourceConfig } from "@/resources/registry";
import { useResourceList } from "@/hooks/use-resources";
import { AsyncBoundary } from "@/components/bo/async-boundary";
import { DataTable } from "@/components/bo/data-table";
import { PageHeader } from "@/components/bo/page-header";
import { NotFoundView } from "@/components/bo/not-found";

export function ResourceListPage() {
  const params = useParams({ strict: false });
  const resource = params.resource ?? "";
  const config = getResourceConfig(resource);
  const navigate = useNavigate();
  const query = useResourceList(resource, Boolean(config));

  if (!config) {
    return <NotFoundView title="Unknown section" body={`There is no "${resource}" section.`} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title={config.label} subtitle={`Browse ${config.label.toLowerCase()}`} />
      <AsyncBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        loadingLabel={`Loading ${config.label.toLowerCase()}…`}
      >
        {(rows) => (
          <DataTable
            config={config}
            rows={rows}
            onRowClick={(id) =>
              navigate({ to: "/$resource/$id", params: { resource, id } })
            }
          />
        )}
      </AsyncBoundary>
    </div>
  );
}
