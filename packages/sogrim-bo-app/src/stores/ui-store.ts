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

type Theme = "light" | "dark";

function applyPaletteClass(palette: Palette) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  for (const p of PALETTES) {
    html.classList.toggle(`palette-${p}`, p === palette);
  }
}

function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

interface UiState {
  theme: Theme;
  palette: Palette;
  sidebarCollapsed: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setPalette: (palette: Palette) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "light",
      palette: DEFAULT_PALETTE,
      sidebarCollapsed: false,
      toggleTheme: () =>
        set((state) => {
          const next: Theme = state.theme === "light" ? "dark" : "light";
          applyThemeClass(next);
          return { theme: next };
        }),
      setTheme: (theme) => {
        applyThemeClass(theme);
        set({ theme });
      },
      setPalette: (palette) => {
        applyPaletteClass(palette);
        set({ palette });
      },
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: "sogrim-bo-ui",
      partialize: (state) => ({
        theme: state.theme,
        palette: state.palette,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      // Re-apply the restored appearance to the DOM on load, so a refresh keeps
      // the chosen theme/palette instead of flashing back to the defaults.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyThemeClass(state.theme);
        applyPaletteClass(normalizePalette(state.palette));
      },
    },
  ),
);

// Apply the default palette immediately for the very first load (before any
// persisted state rehydrates).
applyPaletteClass(DEFAULT_PALETTE);
