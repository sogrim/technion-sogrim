import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResourceDetail } from "./resource-detail";

beforeEach(() => localStorage.clear());

const record = { name: "Algo", credit: 3 }; // scalar-only so Overview has no JSON tree

describe("ResourceDetail", () => {
  it("offers an Overview/JSON toggle and defaults to Overview", () => {
    render(<ResourceDetail record={record} />);
    expect(screen.getByRole("button", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "JSON" })).toBeInTheDocument();
    // Overview is active: the Details card is present, the raw JSON copy is not.
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copy json/i })).not.toBeInTheDocument();
  });

  it("switches to the raw JSON view when JSON is selected", () => {
    render(<ResourceDetail record={record} />);
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    expect(screen.getByRole("button", { name: /copy json/i })).toBeInTheDocument();
    expect(screen.queryByText("Details")).not.toBeInTheDocument();
  });

  it("remembers the chosen view across remounts", () => {
    const { unmount } = render(<ResourceDetail record={record} />);
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    unmount();
    render(<ResourceDetail record={record} />);
    expect(screen.getByRole("button", { name: /copy json/i })).toBeInTheDocument();
  });
});
