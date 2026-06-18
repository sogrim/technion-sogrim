import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field } from "./field";
import { EM_DASH } from "@/lib/format";

describe("Field", () => {
  it("renders the label and the formatted value", () => {
    render(<Field label="Total Credit" value={118.5} />);
    expect(screen.getByText("Total Credit")).toBeInTheDocument();
    expect(screen.getByText("118.5")).toBeInTheDocument();
  });

  it("renders an em-dash for an empty value", () => {
    render(<Field label="Description" value={null} />);
    expect(screen.getByText(EM_DASH)).toBeInTheDocument();
  });

  it("applies a custom format function", () => {
    render(<Field label="Faculty" value="ComputerScience" format={(v) => `F:${v}`} />);
    expect(screen.getByText("F:ComputerScience")).toBeInTheDocument();
  });

  it("shows a copy button when copyable and non-empty", () => {
    render(<Field label="ID" value="abc" copyable />);
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });

  it("hides the copy button for empty values", () => {
    render(<Field label="ID" value={null} copyable />);
    expect(screen.queryByRole("button", { name: /copy/i })).not.toBeInTheDocument();
  });
});
