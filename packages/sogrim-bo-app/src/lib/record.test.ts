import { describe, it, expect } from "vitest";
import { partitionFields } from "./record";

describe("partitionFields", () => {
  it("splits a record into scalar fields and complex (nested) fields, preserving order", () => {
    const { scalarFields, complexFields } = partitionFields({
      name: "x",
      credit: 3,
      tags: ["a", "b"],
      details: { a: 1 },
    });
    expect(scalarFields).toEqual([
      { key: "name", value: "x" },
      { key: "credit", value: 3 },
    ]);
    expect(complexFields).toEqual([
      { key: "tags", value: ["a", "b"] },
      { key: "details", value: { a: 1 } },
    ]);
  });

  it("treats bson {$oid} / {$date} wrappers and null as scalar", () => {
    const { scalarFields, complexFields } = partitionFields({
      _id: { $oid: "abc" },
      last_seen: { $date: "2023-01-01T00:00:00Z" },
      missing: null,
    });
    expect(scalarFields.map((f) => f.key)).toEqual(["_id", "last_seen", "missing"]);
    expect(complexFields).toEqual([]);
  });

  it("returns empty arrays for an empty record", () => {
    expect(partitionFields({})).toEqual({ scalarFields: [], complexFields: [] });
  });
});
