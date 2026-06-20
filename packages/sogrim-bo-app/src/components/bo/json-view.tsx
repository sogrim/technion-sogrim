import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

/** A lightweight, dependency-free JSON tree with collapse + copy, themed via
 *  Tailwind tokens so it matches the rest of the design system. */
export function JsonView({ data, className }: { data: unknown; className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-lg border bg-muted/30",
        className,
      )}
    >
      <div className="absolute top-1.5 left-1.5 z-10">
        <CopyButton value={JSON.stringify(data, null, 2)} label="Copy JSON" />
      </div>
      <div dir="ltr" className="overflow-auto p-3 pl-10 font-mono text-xs leading-relaxed">
        <JsonNode value={data} label={null} depth={0} />
      </div>
    </div>
  );
}

function JsonKey({ label }: { label: string }) {
  return <span className="text-foreground/70">{label}</span>;
}

function JsonScalar({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">null</span>;
  }
  if (typeof value === "string") {
    return <span className="text-success break-all">{`"${value}"`}</span>;
  }
  if (typeof value === "number") {
    return <span className="text-info">{String(value)}</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-warning">{String(value)}</span>;
  }
  return <span className="break-all">{String(value)}</span>;
}

// Containers at or beyond this depth, or with more than this many entries, start
// collapsed so a heavy document (e.g. a user with a long course history) doesn't
// render its entire tree synchronously.
const COLLAPSE_DEPTH = 2;
const LARGE_CONTAINER = 50;

interface JsonNodeProps {
  value: unknown;
  /** Object key / shown label; null for the root and array items. */
  label: string | null;
  depth: number;
}

function JsonNode({ value, label, depth }: JsonNodeProps) {
  const isContainer = value !== null && typeof value === "object";

  if (!isContainer) {
    return (
      <div className="whitespace-pre-wrap">
        {label !== null && (
          <>
            <JsonKey label={label} />
            <span className="text-muted-foreground">: </span>
          </>
        )}
        <JsonScalar value={value} />
      </div>
    );
  }

  return <JsonContainer value={value as object} label={label} depth={depth} />;
}

function JsonContainer({
  value,
  label,
  depth,
}: {
  value: object;
  label: string | null;
  depth: number;
}) {
  const isArray = Array.isArray(value);
  const entries: [string, unknown][] = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v])
    : Object.entries(value as Record<string, unknown>);
  const [collapsed, setCollapsed] = useState(
    () => depth >= COLLAPSE_DEPTH || entries.length > LARGE_CONTAINER,
  );

  const open = isArray ? "[" : "{";
  const close = isArray ? "]" : "}";
  const countLabel = `${entries.length} ${isArray ? "items" : "keys"}`;

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand" : "Collapse"}
          className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        {label !== null && (
          <>
            <JsonKey label={label} />
            <span className="text-muted-foreground">: </span>
          </>
        )}
        <span className="text-muted-foreground">{open}</span>
        {collapsed && (
          <span className="text-muted-foreground">
            {" "}
            {countLabel} {close}
          </span>
        )}
      </div>
      {!collapsed && (
        <>
          <div className="ms-2 border-s border-border/60 ps-3">
            {entries.map(([k, v]) => (
              <JsonNode key={k} label={isArray ? null : k} value={v} depth={depth + 1} />
            ))}
          </div>
          <div className="text-muted-foreground">{close}</div>
        </>
      )}
    </div>
  );
}
