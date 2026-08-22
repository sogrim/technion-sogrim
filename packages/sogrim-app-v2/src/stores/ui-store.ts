import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  /** Masks the GPA wherever it's surfaced, for shoulder-surfing / screen-sharing. */
  hideGpa: boolean;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setPalette: (palette: Palette) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentSemester: (idx: number) => void;
  setError: (msg: string) => void;
  clearError: () => void;
  toggleHideGpa: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "light",
      palette: DEFAULT_PALETTE,
      sidebarCollapsed: false,
      currentSemesterIdx: 0,
      errorMsg: "",
      hideGpa: false,
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
      toggleHideGpa: () => set((state) => ({ hideGpa: !state.hideGpa })),
    }),
    {
      name: "sogrim-ui",
      // `theme`/`palette` are authoritative on the server and re-applied on load
      // (see Header), and the rest is per-session view state. Only the GPA
      // privacy flag is worth remembering across reloads.
      partialize: (state) => ({ hideGpa: state.hideGpa }),
    },
  ),
);

/** Hook used by feature components that render an OG-faithful variant when
 *  the Sogrim Classic palette is active. */
export function useIsOgPalette(): boolean {
  return useUiStore((s) => s.palette === "sogrim");
}
