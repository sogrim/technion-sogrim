import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Overview } from "./overview";

describe("Overview", () => {
  it("renders top-level scalar fields with humanized labels", () => {
    render(<Overview record={{ name: "X", total_credit: 118.5 }} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(screen.getByText("Total Credit")).toBeInTheDocument();
    expect(screen.getByText("118.5")).toBeInTheDocument();
  });

  it("renders complex fields as their own titled sections", () => {
    render(<Overview record={{ course_banks: [{ name: "חובה" }] }} />);
    expect(screen.getByText("Course Banks")).toBeInTheDocument();
    // the nested JSON tree exposes the object key
    expect(screen.getByText("name")).toBeInTheDocument();
  });

  it("shows an empty state when there are no fields", () => {
    render(<Overview record={{}} />);
    expect(screen.getByText(/no fields/i)).toBeInTheDocument();
  });
});
