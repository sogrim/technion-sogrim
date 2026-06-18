/**
 * Display formatting helpers for the back office.
 *
 * The back office renders arbitrary documents coming straight from MongoDB, so
 * these helpers turn raw keys/values into something human-friendly while leaving
 * the raw shape available for the JSON view.
 */

/** Em-dash used to signal an empty / absent value. */
export const EM_DASH = "—";

/** Turn an object key into a human label: `total_credit` -> "Total Credit". */
export function humanizeLabel(key: string): string {
  const cleaned = key.replace(/^_+/, "");
  if (cleaned.toLowerCase() === "id") return "ID";
  return cleaned
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Insert spaces between PascalCase words: `ComputerScience` -> "Computer Science". */
export function splitPascalCase(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

type OidWrapper = { $oid: string };
type DateWrapper = { $date: string | number | { $numberLong: string } };

function isOid(v: unknown): v is OidWrapper {
  return (
    typeof v === "object" &&
    v !== null &&
    "$oid" in v &&
    typeof (v as Record<string, unknown>).$oid === "string"
  );
}

function isDateWrapper(v: unknown): v is DateWrapper {
  return typeof v === "object" && v !== null && "$date" in v;
}

/**
 * Whether a value can be rendered as a single line of text (vs. needing the
 * nested JSON tree). Primitives plus the bson `{$oid}` / `{$date}` wrappers.
 */
export function isScalar(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return true;
  return isOid(value) || isDateWrapper(value);
}

/** Parse a bson date wrapper (or epoch millis / ISO string) to epoch millis. */
function bsonDateToMillis(value: unknown): number | null {
  if (isDateWrapper(value)) {
    const d = value.$date;
    if (typeof d === "string") {
      const parsed = Date.parse(d);
      return Number.isNaN(parsed) ? null : parsed;
    }
    if (typeof d === "number") return d;
    if (d && typeof d === "object" && "$numberLong" in d) {
      const n = Number(d.$numberLong);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  }
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

/** Format a single bson date wrapper (or epoch millis) as `YYYY-MM-DD` in UTC. */
export function formatDate(value: unknown): string {
  const millis = bsonDateToMillis(value);
  if (millis === null) return EM_DASH;
  return new Date(millis).toISOString().slice(0, 10);
}

/**
 * A comparable key for sorting raw cell values. Unwraps bson wrappers so a
 * `{$date}` column sorts chronologically (by epoch millis) and a `{$oid}`
 * column sorts by hex — instead of every wrapper stringifying to
 * "[object Object]" and comparing equal.
 */
export function toSortValue(value: unknown): number | string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") return value;
  if (isOid(value)) return value.$oid;
  if (isDateWrapper(value)) {
    const millis = bsonDateToMillis(value);
    return millis === null ? "" : millis;
  }
  return "";
}

/** Format a scalar value for inline display, using an em-dash for empties. */
export function formatScalar(value: unknown): string {
  if (value === null || value === undefined) return EM_DASH;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    return value.trim() === "" ? EM_DASH : value;
  }
  if (isOid(value)) return value.$oid;
  if (isDateWrapper(value)) return formatDate(value);
  return EM_DASH;
}
