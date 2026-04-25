import { create } from "zustand";

export const PALETTES = ["sogrim", "teal", "botanical", "midnight"] as const;
export type Palette = (typeof PALETTES)[number];
export const DEFAULT_PALETTE: Palette = "sogrim";

/** Palettes whose visual identity only works in dark mode. Selecting one of
 *  these auto-flips the theme to dark so the user sees the intended look. */
export const DARK_ONLY_PALETTES: ReadonlySet<Palette> = new Set<Palette>(["midnight"]);

export function isPalette(v: unknown): v is Palette {
  return typeof v === "string" && (PALETTES as readonly string[]).includes(v);
}

/** Normalize an unknown stored value into a Palette, falling back to the default. */
export function normalizePalette(v: unknown): Palette {
  return isPalette(v) ? v : DEFAULT_PALETTE;
}

function applyPaletteClass(palette: Palette) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  for (const p of PALETTES) {
    html.classList.toggle(`palette-${p}`, p === palette);
  }
}

applyPaletteClass(DEFAULT_PALETTE);

interface UiState {
  theme: "light" | "dark";
  palette: Palette;
  sidebarCollapsed: boolean;
  currentSemesterIdx: number;
  errorMsg: string;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setPalette: (palette: Palette) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentSemester: (idx: number) => void;
  setError: (msg: string) => void;
  clearError: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme: "light",
  palette: DEFAULT_PALETTE,
  sidebarCollapsed: false,
  currentSemesterIdx: 0,
  errorMsg: "",
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      return { theme: newTheme };
    }),
  setTheme: (theme) => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },
  setPalette: (palette) => {
    applyPaletteClass(palette);
    set({ palette });
  },
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCurrentSemester: (idx) => set({ currentSemesterIdx: idx }),
  setError: (msg) => set({ errorMsg: msg }),
  clearError: () => set({ errorMsg: "" }),
}));

/** Hook used by feature components that render an OG-faithful variant when
 *  the Sogrim Classic palette is active. */
export function useIsOgPalette(): boolean {
  return useUiStore((s) => s.palette === "sogrim");
}
