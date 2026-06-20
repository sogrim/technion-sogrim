import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JsonView } from "./json-view";

const writeText = vi.fn().mockResolvedValue(undefined);
beforeEach(() => {
  writeText.mockClear();
  Object.assign(navigator, { clipboard: { writeText } });
});

describe("JsonView", () => {
  it("renders object keys and quoted string values", () => {
    render(<JsonView data={{ name: "Algo", credit: 3 }} />);
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText('"Algo"')).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders null and boolean literals", () => {
    render(<JsonView data={{ a: null, b: true }} />);
    expect(screen.getByText("null")).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("recurses into nested objects", () => {
    render(<JsonView data={{ outer: { inner: 1 } }} />);
    expect(screen.getByText("outer")).toBeInTheDocument();
    expect(screen.getByText("inner")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders array items", () => {
    render(<JsonView data={[10, 20]} />);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("copies the pretty-printed JSON", () => {
    render(<JsonView data={{ a: 1 }} />);
    fireEvent.click(screen.getByRole("button", { name: /copy json/i }));
    expect(writeText).toHaveBeenCalledWith(JSON.stringify({ a: 1 }, null, 2));
  });

  it("collapses a node, hiding its children", () => {
    render(<JsonView data={{ a: 1 }} />);
    expect(screen.getByText("a")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /collapse/i }));
    expect(screen.queryByText("a")).not.toBeInTheDocument();
  });

  it("auto-collapses deeply nested containers (perf guard)", () => {
    // root(0) -> a(1) -> b(2): b is at the collapse depth, so its child is hidden
    render(<JsonView data={{ a: { b: { deep: 1 } } }} />);
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.queryByText("deep")).not.toBeInTheDocument();
  });

  it("auto-collapses large arrays, showing a count summary", () => {
    const data = { items: Array.from({ length: 60 }, (_, i) => ({ n: i })) };
    render(<JsonView data={data} />);
    expect(screen.getByText("items")).toBeInTheDocument();
    expect(screen.getByText(/60 items/)).toBeInTheDocument();
  });
});
