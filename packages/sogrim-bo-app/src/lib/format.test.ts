import { describe, it, expect } from "vitest";
import {
  EM_DASH,
  humanizeLabel,
  splitPascalCase,
  isScalar,
  formatScalar,
  formatDate,
  toSortValue,
} from "./format";

describe("humanizeLabel", () => {
  it("title-cases snake_case keys", () => {
    expect(humanizeLabel("total_credit")).toBe("Total Credit");
    expect(humanizeLabel("course_to_bank")).toBe("Course To Bank");
    expect(humanizeLabel("last_seen")).toBe("Last Seen");
  });

  it("splits camelCase keys", () => {
    expect(humanizeLabel("createdAt")).toBe("Created At");
  });

  it("renders id keys as 'ID'", () => {
    expect(humanizeLabel("_id")).toBe("ID");
    expect(humanizeLabel("id")).toBe("ID");
  });

  it("capitalizes a single plain word", () => {
    expect(humanizeLabel("name")).toBe("Name");
  });
});

describe("splitPascalCase", () => {
  it("inserts spaces between PascalCase words", () => {
    expect(splitPascalCase("ComputerScience")).toBe("Computer Science");
    expect(splitPascalCase("DataAndDecisionScience")).toBe(
      "Data And Decision Science",
    );
  });

  it("leaves single words untouched", () => {
    expect(splitPascalCase("Unknown")).toBe("Unknown");
  });
});

describe("isScalar", () => {
  it("treats primitives as scalar", () => {
    expect(isScalar(null)).toBe(true);
    expect(isScalar(undefined)).toBe(true);
    expect(isScalar("x")).toBe(true);
    expect(isScalar(3)).toBe(true);
    expect(isScalar(true)).toBe(true);
  });

  it("treats bson {$oid} and {$date} wrappers as scalar", () => {
    expect(isScalar({ $oid: "abc" })).toBe(true);
    expect(isScalar({ $date: "2023-01-15T00:00:00Z" })).toBe(true);
  });

  it("treats arrays and plain objects as non-scalar", () => {
    expect(isScalar([1, 2])).toBe(false);
    expect(isScalar({ a: 1 })).toBe(false);
  });
});

describe("formatScalar", () => {
  it("renders empty values as an em-dash", () => {
    expect(formatScalar(null)).toBe(EM_DASH);
    expect(formatScalar(undefined)).toBe(EM_DASH);
    expect(formatScalar("")).toBe(EM_DASH);
    expect(formatScalar("   ")).toBe(EM_DASH);
  });

  it("renders booleans as Yes/No", () => {
    expect(formatScalar(true)).toBe("Yes");
    expect(formatScalar(false)).toBe("No");
  });

  it("renders numbers, including zero", () => {
    expect(formatScalar(118.5)).toBe("118.5");
    expect(formatScalar(0)).toBe("0");
  });

  it("renders plain strings as-is", () => {
    expect(formatScalar("אינפי 1")).toBe("אינפי 1");
  });

  it("unwraps a bson ObjectId", () => {
    expect(formatScalar({ $oid: "6192e5f4d6c89bbe5647f8db" })).toBe(
      "6192e5f4d6c89bbe5647f8db",
    );
  });

  it("formats a bson date wrapper", () => {
    expect(formatScalar({ $date: "2023-01-15T10:30:00Z" })).toBe("2023-01-15");
  });
});

describe("formatDate", () => {
  it("formats an ISO string date wrapper to YYYY-MM-DD (UTC)", () => {
    expect(formatDate({ $date: "2023-01-15T10:30:00Z" })).toBe("2023-01-15");
  });

  it("formats a millis-since-epoch date wrapper", () => {
    // 2021-11-16T... — bson extended JSON numberLong form
    expect(formatDate({ $date: { $numberLong: "1637000000000" } })).toBe(
      "2021-11-15",
    );
  });

  it("returns an em-dash for missing dates", () => {
    expect(formatDate(null)).toBe(EM_DASH);
    expect(formatDate(undefined)).toBe(EM_DASH);
  });
});

describe("toSortValue", () => {
  it("unwraps bson dates to epoch millis so they sort chronologically", () => {
    expect(toSortValue({ $date: "2023-01-15T10:00:00Z" })).toBe(
      Date.parse("2023-01-15T10:00:00Z"),
    );
    expect(toSortValue({ $date: { $numberLong: "1637000000000" } })).toBe(1637000000000);
  });

  it("unwraps bson ObjectIds to their hex string", () => {
    expect(toSortValue({ $oid: "6192e5f4d6c89bbe5647f8db" })).toBe("6192e5f4d6c89bbe5647f8db");
  });

  it("passes numbers through and maps booleans to numbers", () => {
    expect(toSortValue(118.5)).toBe(118.5);
    expect(toSortValue(true)).toBe(1);
    expect(toSortValue(false)).toBe(0);
  });

  it("returns strings as-is and empty for nullish", () => {
    expect(toSortValue("algo")).toBe("algo");
    expect(toSortValue(null)).toBe("");
    expect(toSortValue(undefined)).toBe("");
  });
});
