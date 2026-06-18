import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "./ui-store";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
});

describe("ui-store", () => {
  it("applies the dark class and persists the chosen theme across reloads", () => {
    useUiStore.getState().setTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    // Persisted so a refresh restores it (was previously lost on reload).
    expect(localStorage.getItem("sogrim-bo-ui")).toContain("dark");
  });

  it("applies and persists the chosen palette", () => {
    useUiStore.getState().setPalette("teal");
    expect(document.documentElement.classList.contains("palette-teal")).toBe(true);
    expect(localStorage.getItem("sogrim-bo-ui")).toContain("teal");
  });
});
