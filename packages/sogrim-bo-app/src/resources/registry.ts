import type { LucideIcon } from "lucide-react";
import { BookMarked, GraduationCap, Users } from "lucide-react";
import {
  EM_DASH,
  formatDate,
  formatScalar,
  humanizeLabel,
  splitPascalCase,
} from "@/lib/format";
import type { ResourceRecord } from "@/types/bo";

export interface ColumnDef {
  /** Field key; also the default accessor (`row[key]`) and label source. */
  key: string;
  label: string;
  /** Pull the raw value for this cell. Defaults to `row[key]`. */
  accessor?: (row: ResourceRecord) => unknown;
  /** Render the raw value as text. Defaults to `formatScalar`. */
  format?: (value: unknown, row: ResourceRecord) => string;
  /** Cell alignment; numbers read better end-aligned. */
  align?: "start" | "end";
  /** Whether the column is sortable (default true). */
  sortable?: boolean;
}

export interface ResourceConfig {
  /** Route segment / lookup key, e.g. "catalogs". */
  key: string;
  /** Plural label for nav + headings. */
  label: string;
  /** Singular label for the detail page. */
  singular: string;
  /** Sidebar icon. */
  icon: LucideIcon;
  /** Stable id used for the detail route. */
  getId: (row: ResourceRecord) => string;
  /** Primary human title for a record. */
  getTitle: (row: ResourceRecord) => string;
  /** Optional secondary line under the title. */
  getSubtitle?: (row: ResourceRecord) => string;
  /** List/table columns. */
  columns: ColumnDef[];
}

/** Build a column with a humanized default label. */
function col(key: string, opts: Partial<Omit<ColumnDef, "key">> = {}): ColumnDef {
  return { key, label: opts.label ?? humanizeLabel(key), ...opts };
}

function oidOf(value: unknown): string {
  if (value && typeof value === "object" && "$oid" in value) {
    return String((value as { $oid: unknown }).$oid);
  }
  return String(value ?? "");
}

function countOf(value: unknown): string {
  if (Array.isArray(value)) return String(value.length);
  if (value && typeof value === "object") return String(Object.keys(value).length);
  return "0";
}

function tagsFormat(value: unknown): string {
  return Array.isArray(value) && value.length > 0 ? value.join(", ") : EM_DASH;
}

const catalogs: ResourceConfig = {
  key: "catalogs",
  label: "Catalogs",
  singular: "Catalog",
  icon: BookMarked,
  getId: (row) => oidOf(row._id),
  getTitle: (row) => String(row.name ?? EM_DASH),
  getSubtitle: (row) => splitPascalCase(String(row.faculty ?? "")),
  columns: [
    col("name", { label: "Name" }),
    col("faculty", { format: (v) => splitPascalCase(String(v ?? "")) || EM_DASH }),
    col("total_credit", { label: "Total Credit", align: "end" }),
    col("course_banks", {
      label: "Banks",
      align: "end",
      sortable: false,
      format: (v) => countOf(v),
    }),
    col("course_to_bank", {
      label: "Courses",
      align: "end",
      sortable: false,
      format: (v) => countOf(v),
    }),
  ],
};

const courses: ResourceConfig = {
  key: "courses",
  label: "Courses",
  singular: "Course",
  icon: GraduationCap,
  getId: (row) => String(row._id ?? ""),
  getTitle: (row) => String(row.name ?? EM_DASH),
  getSubtitle: (row) => String(row._id ?? ""),
  columns: [
    col("_id", { label: "ID" }),
    col("name", { label: "Name" }),
    col("credit", { align: "end" }),
    col("tags", { sortable: false, format: tagsFormat }),
  ],
};

const users: ResourceConfig = {
  key: "users",
  label: "Users",
  singular: "User",
  icon: Users,
  getId: (row) => String(row.sub ?? row._id ?? ""),
  getTitle: (row) => String(row.sub ?? row._id ?? EM_DASH),
  getSubtitle: (row) => String(row.permissions ?? ""),
  columns: [
    col("permissions"),
    col("catalog_name", { label: "Catalog" }),
    col("total_credit", { label: "Total Credit", align: "end" }),
    col("num_courses", { label: "Courses", align: "end" }),
    col("last_seen", { format: (v) => formatDate(v) }),
  ],
};

export const RESOURCES: ResourceConfig[] = [catalogs, courses, users];

export function getResourceConfig(key: string): ResourceConfig | undefined {
  return RESOURCES.find((r) => r.key === key);
}

/** Raw value for a cell — accessor if present, else `row[key]`. */
export function resolveCellValue(column: ColumnDef, row: ResourceRecord): unknown {
  return column.accessor ? column.accessor(row) : row[column.key];
}

/** Display string for a cell — column formatter if present, else `formatScalar`. */
export function resolveCellDisplay(column: ColumnDef, row: ResourceRecord): string {
  const value = resolveCellValue(column, row);
  return column.format ? column.format(value, row) : formatScalar(value);
}

/** Lowercased haystack for client-side filtering of a row. */
export function buildRowSearchText(config: ResourceConfig, row: ResourceRecord): string {
  const parts = [config.getTitle(row), config.getId(row)];
  for (const column of config.columns) {
    parts.push(resolveCellDisplay(column, row));
  }
  return parts.join(" ").toLowerCase();
}
