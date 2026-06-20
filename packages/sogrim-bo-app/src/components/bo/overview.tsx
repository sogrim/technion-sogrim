import { humanizeLabel } from "@/lib/format";
import { partitionFields } from "@/lib/record";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResourceRecord } from "@/types/bo";
import { Field } from "./field";
import { JsonView } from "./json-view";

function countLabel(value: unknown): string | null {
  if (Array.isArray(value)) return `${value.length}`;
  if (value && typeof value === "object") return `${Object.keys(value).length}`;
  return null;
}

/**
 * Human-friendly structured view of a document: top-level scalars as labelled
 * fields, and nested arrays/objects as their own collapsible JSON sections.
 */
export function Overview({ record }: { record: ResourceRecord }) {
  const { scalarFields, complexFields } = partitionFields(record);

  if (scalarFields.length === 0 && complexFields.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No fields to display.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {scalarFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {scalarFields.map((f) => (
              <Field key={f.key} label={humanizeLabel(f.key)} value={f.value} copyable />
            ))}
          </CardContent>
        </Card>
      )}

      {complexFields.map((f) => {
        const count = countLabel(f.value);
        return (
          <Card key={f.key}>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>{humanizeLabel(f.key)}</CardTitle>
              {count !== null && (
                <span className="text-xs text-muted-foreground">{count}</span>
              )}
            </CardHeader>
            <CardContent>
              <JsonView data={f.value} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
