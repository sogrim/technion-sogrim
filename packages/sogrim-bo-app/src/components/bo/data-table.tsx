import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toSortValue } from "@/lib/format";
import {
  buildRowSearchText,
  resolveCellDisplay,
  resolveCellValue,
  type ColumnDef,
  type ResourceConfig,
} from "@/resources/registry";
import type { ResourceRecord } from "@/types/bo";

interface DataTableProps {
  config: ResourceConfig;
  rows: ResourceRecord[];
  onRowClick?: (id: string) => void;
}

type SortDir = "asc" | "desc";
interface SortState {
  key: string;
  dir: SortDir;
}

function compareValues(a: unknown, b: unknown): number {
  // Sort on a bson-aware key so {$date}/{$oid} columns order correctly instead
  // of every wrapper stringifying to "[object Object]".
  const av = toSortValue(a);
  const bv = toSortValue(b);
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  return String(av).localeCompare(String(bv), undefined, { numeric: true });
}

function SortIcon({ state, columnKey }: { state: SortState | null; columnKey: string }) {
  if (state?.key !== columnKey) {
    return <ChevronsUpDown className="size-3 opacity-40" />;
  }
  return state.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function DataTable({ config, rows, onRowClick }: DataTableProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => buildRowSearchText(config, row).includes(q));
  }, [rows, query, config]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = config.columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const out = [...filtered].sort((a, b) =>
      compareValues(resolveCellValue(col, a), resolveCellValue(col, b)),
    );
    return sort.dir === "desc" ? out.reverse() : out;
  }, [filtered, sort, config]);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      return prev.dir === "asc" ? { key, dir: "desc" } : null;
    });
  }

  const noData = rows.length === 0;
  const noMatches = !noData && sorted.length === 0;
  const label = config.label.toLowerCase();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${label}…`}
            className="ps-8"
            aria-label={`Search ${label}`}
          />
        </div>
        <span className="whitespace-nowrap text-sm text-muted-foreground tabular-nums">
          {sorted.length}
          {sorted.length !== rows.length ? ` / ${rows.length}` : ""}
        </span>
      </div>

      {noData ? (
        <EmptyState>{`No ${label} found.`}</EmptyState>
      ) : noMatches ? (
        <EmptyState>{`No matching ${label}.`}</EmptyState>
      ) : (
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {config.columns.map((col: ColumnDef) => (
                  <th key={col.key} className={cn(col.align === "end" && "text-end")}>
                    {col.sortable === false ? (
                      <span className="block px-3 py-2 text-xs font-semibold text-muted-foreground">
                        {col.label}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          "flex w-full items-center gap-1 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground",
                          col.align === "end" && "justify-end",
                        )}
                      >
                        <span>{col.label}</span>
                        <SortIcon state={sort} columnKey={col.key} />
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const id = config.getId(row);
                return (
                  <tr
                    key={id}
                    tabIndex={0}
                    aria-label={`Open ${config.singular}: ${config.getTitle(row)}`}
                    onClick={() => onRowClick?.(id)}
                    onKeyDown={(e) => {
                      // Activate on Enter and Space (button-like), without scrolling.
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick?.(id);
                      }
                    }}
                    className="cursor-pointer border-t border-border/60 transition-colors hover:bg-accent/50 focus:bg-accent/50 focus:outline-none"
                  >
                    {config.columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-3 py-2",
                          col.align === "end" && "text-end tabular-nums",
                        )}
                      >
                        {resolveCellDisplay(col, row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
