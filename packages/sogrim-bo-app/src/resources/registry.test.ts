import { describe, it, expect } from "vitest";
import {
  RESOURCES,
  getResourceConfig,
  resolveCellValue,
  resolveCellDisplay,
  buildRowSearchText,
  type ColumnDef,
} from "./registry";
import { EM_DASH } from "@/lib/format";

describe("RESOURCES", () => {
  it("exposes catalogs, courses and users in nav order", () => {
    expect(RESOURCES.map((r) => r.key)).toEqual(["catalogs", "courses", "users"]);
  });

  it("looks up a config by key, undefined for unknown", () => {
    expect(getResourceConfig("courses")?.singular).toBe("Course");
    expect(getResourceConfig("nope")).toBeUndefined();
  });
});

describe("catalogs config", () => {
  const cfg = getResourceConfig("catalogs")!;
  const row = {
    _id: { $oid: "6192e5f4d6c89bbe5647f8db" },
    name: "מדמח תלת שנתי 2024-2025",
    faculty: "ComputerScience",
    total_credit: 118.5,
    course_banks: [{ name: "a" }, { name: "b" }, { name: "c" }],
    course_to_bank: { "1": "a", "2": "b" },
  };

  it("derives id from the bson ObjectId", () => {
    expect(cfg.getId(row)).toBe("6192e5f4d6c89bbe5647f8db");
  });

  it("uses the catalog name as the title", () => {
    expect(cfg.getTitle(row)).toBe("מדמח תלת שנתי 2024-2025");
  });

  it("humanizes the faculty value in its column", () => {
    const facultyCol = cfg.columns.find((c) => c.key === "faculty")!;
    expect(resolveCellDisplay(facultyCol, row)).toBe("Computer Science");
  });

  it("summarizes the number of banks via an accessor column", () => {
    const banksCol = cfg.columns.find((c) => c.key === "course_banks")!;
    expect(resolveCellDisplay(banksCol, row)).toBe("3");
  });
});

describe("courses config", () => {
  const cfg = getResourceConfig("courses")!;

  it("derives id from the string _id", () => {
    expect(cfg.getId({ _id: "02340125" })).toBe("02340125");
  });

  it("renders tags as a comma list, em-dash when absent", () => {
    const tagsCol = cfg.columns.find((c) => c.key === "tags")!;
    expect(resolveCellDisplay(tagsCol, { tags: ["English", "Malag"] })).toBe("English, Malag");
    expect(resolveCellDisplay(tagsCol, { tags: null })).toBe(EM_DASH);
    expect(resolveCellDisplay(tagsCol, {})).toBe(EM_DASH);
  });
});

describe("users config", () => {
  const cfg = getResourceConfig("users")!;

  it("derives id from sub (list / UserSummary payload)", () => {
    expect(cfg.getId({ sub: "11112222" })).toBe("11112222");
  });

  it("derives id and title from _id (full detail payload, where sub serializes as _id)", () => {
    const detail = { _id: "11112222333344445555", permissions: "Owner" };
    expect(cfg.getId(detail)).toBe("11112222333344445555");
    expect(cfg.getTitle(detail)).toBe("11112222333344445555");
  });

  it("formats last_seen as a date", () => {
    const col = cfg.columns.find((c) => c.key === "last_seen")!;
    expect(resolveCellDisplay(col, { last_seen: { $date: "2023-01-15T10:00:00Z" } })).toBe(
      "2023-01-15",
    );
    expect(resolveCellDisplay(col, { last_seen: null })).toBe(EM_DASH);
  });
});

describe("cell + search helpers", () => {
  const col: ColumnDef = { key: "name", label: "Name" };

  it("resolveCellValue falls back to row[key] when no accessor", () => {
    expect(resolveCellValue(col, { name: "hi" })).toBe("hi");
  });

  it("resolveCellValue uses the accessor when given", () => {
    const c: ColumnDef = { key: "x", label: "X", accessor: (r) => (r.a as number) + 1 };
    expect(resolveCellValue(c, { a: 1 })).toBe(2);
  });

  it("buildRowSearchText lowercases title and visible cells", () => {
    const cfg = getResourceConfig("courses")!;
    const text = buildRowSearchText(cfg, { _id: "02340125", name: "Algo", credit: 3 });
    expect(text).toContain("algo");
    expect(text).toContain("02340125");
  });
});
