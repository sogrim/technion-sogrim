import { LogOut, Moon, Sun } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import {
  DARK_ONLY_PALETTES,
  PALETTES,
  normalizePalette,
  useUiStore,
  type Palette,
} from "@/stores/ui-store";
import { USE_MOCKS } from "@/data/provider";

const PALETTE_LABELS: Record<Palette, string> = {
  sogrim: "Sogrim",
  teal: "Teal",
  botanical: "Botanical",
  midnight: "Midnight",
};

export function Header() {
  const { userInfo, logout } = useAuthStore();
  const { theme, palette, toggleTheme, setTheme, setPalette } = useUiStore();

  function handlePalette(value: string) {
    const next = normalizePalette(value);
    setPalette(next);
    // Dark-only palettes only look right in dark mode — flip automatically.
    if (DARK_ONLY_PALETTES.has(next)) setTheme("dark");
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-card px-3 shadow-sm md:h-[60px] md:px-6">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          View-only
        </span>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <label className="sr-only" htmlFor="palette">
          Palette
        </label>
        <select
          id="palette"
          value={palette}
          onChange={(e) => handlePalette(e.target.value)}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {PALETTES.map((p) => (
            <option key={p} value={p}>
              {PALETTE_LABELS[p]}
            </option>
          ))}
        </select>

        <button
          onClick={toggleTheme}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {userInfo && (
          <div className="flex items-center gap-2">
            {userInfo.picture && (
              <img
                src={userInfo.picture}
                alt=""
                className="size-7 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="hidden text-sm text-foreground md:inline">{userInfo.name}</span>
          </div>
        )}

        {!USE_MOCKS && (
          <button
            onClick={logout}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Logout"
          >
            <LogOut className="size-4" />
          </button>
        )}
      </div>
    </header>
  );
}
