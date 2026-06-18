import { isScalar } from "./format";
import type { ResourceRecord } from "@/types/bo";

export interface RecordField {
  key: string;
  value: unknown;
}

export interface PartitionedFields {
  /** Top-level fields renderable inline (primitives + bson wrappers). */
  scalarFields: RecordField[];
  /** Top-level fields that are arrays/objects and need the JSON tree. */
  complexFields: RecordField[];
}

/**
 * Split a document's top-level entries into inline scalar fields and nested
 * (complex) fields, preserving key order. Drives the generic Overview view.
 */
export function partitionFields(row: ResourceRecord): PartitionedFields {
  const scalarFields: RecordField[] = [];
  const complexFields: RecordField[] = [];
  for (const [key, value] of Object.entries(row)) {
    if (isScalar(value)) {
      scalarFields.push({ key, value });
    } else {
      complexFields.push({ key, value });
    }
  }
  return { scalarFields, complexFields };
}
