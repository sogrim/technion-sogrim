import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable } from "./data-table";
import { getResourceConfig } from "@/resources/registry";

const cfg = getResourceConfig("courses")!;
const rows = [
  { _id: "200", name: "Beta", credit: 1, tags: null },
  { _id: "100", name: "Alpha", credit: 2, tags: null },
];

function bodyRowTexts() {
  // first row is the header
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((r) => r.textContent ?? "");
}

describe("DataTable", () => {
  it("renders column headers and a row per record", () => {
    render(<DataTable config={cfg} rows={rows} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("filters rows by the search query", () => {
    render(<DataTable config={cfg} rows={rows} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "alpha" } });
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  });

  it("calls onRowClick with the resource id when a row is clicked", () => {
    const onRowClick = vi.fn();
    render(<DataTable config={cfg} rows={rows} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText("Alpha"));
    expect(onRowClick).toHaveBeenCalledWith("100");
  });

  it("sorts ascending then descending when a column header is clicked", () => {
    render(<DataTable config={cfg} rows={rows} />);
    const nameHeader = screen.getByRole("button", { name: /name/i });

    fireEvent.click(nameHeader); // ascending
    expect(bodyRowTexts()[0]).toContain("Alpha");

    fireEvent.click(nameHeader); // descending
    expect(bodyRowTexts()[0]).toContain("Beta");
  });

  it("shows an empty state when there are no rows", () => {
    render(<DataTable config={cfg} rows={[]} />);
    expect(screen.getByText(/no .*found/i)).toBeInTheDocument();
  });

  it("shows an empty state when the search matches nothing", () => {
    render(<DataTable config={cfg} rows={rows} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "zzzzz" } });
    const table = screen.queryByRole("table");
    expect(table).not.toBeInTheDocument();
    expect(screen.getByText(/no .*match/i)).toBeInTheDocument();
  });

  it("sorts a bson-date column chronologically (not by [object Object])", () => {
    const ucfg = getResourceConfig("users")!;
    const userRows = [
      { sub: "b", permissions: "Admin", catalog_name: null, total_credit: 0, num_courses: 0, last_seen: { $date: "2026-06-01T00:00:00Z" } },
      { sub: "a", permissions: "Owner", catalog_name: null, total_credit: 0, num_courses: 0, last_seen: { $date: "2025-01-01T00:00:00Z" } },
    ];
    render(<DataTable config={ucfg} rows={userRows} />);
    const header = screen.getByRole("button", { name: /last seen/i });

    fireEvent.click(header); // ascending
    expect(bodyRowTexts()[0]).toContain("2025-01-01");

    fireEvent.click(header); // descending
    expect(bodyRowTexts()[0]).toContain("2026-06-01");
  });

  it("activates a row with the Space key", () => {
    const onRowClick = vi.fn();
    render(<DataTable config={cfg} rows={rows} onRowClick={onRowClick} />);
    const row = screen.getByText("Alpha").closest("tr")!;
    fireEvent.keyDown(row, { key: " " });
    expect(onRowClick).toHaveBeenCalledWith("100");
  });
});
