import { create } from "zustand";

interface UiState {
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  currentSemesterIdx: number;
  errorMsg: string;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentSemester: (idx: number) => void;
  setError: (msg: string) => void;
  clearError: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme: "light",
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
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCurrentSemester: (idx) => set({ currentSemesterIdx: idx }),
  setError: (msg) => set({ errorMsg: msg }),
  clearError: () => set({ errorMsg: "" }),
}));
