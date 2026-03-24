import { Moon, Sun, LogOut, Download, HelpCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useUserState } from "@/hooks/use-user-state";
import { exportCoursesToCsv } from "@/lib/export-csv";
import { Button } from "@/components/ui/button";

export function Header() {
  const { userInfo, logout } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();
  const { data: userState } = useUserState();

  const courseStatuses = userState?.details?.degree_status?.course_statuses;

  function handleExport() {
    if (courseStatuses && courseStatuses.length > 0) {
      exportCoursesToCsv(courseStatuses);
    }
  }

  return (
    <header className="flex h-14 items-center justify-between bg-card px-3 shadow-sm md:h-[60px] md:px-6 shrink-0">
      {/* Right side: Logo (mobile only) */}
      <div className="flex items-center gap-2 shrink-0">
        <h1 className="text-lg font-bold md:hidden text-foreground">
          סוגרים
        </h1>
      </div>

      {/* Left side: Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:inline-flex text-muted-foreground hover:text-foreground"
          onClick={handleExport}
          disabled={!courseStatuses || courseStatuses.length === 0}
        >
          <Download className="h-4 w-4" />
          <span className="text-xs">יצוא נתונים</span>
        </Button>

        <Link to="/faq">
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="text-xs">שאלות ותשובות</span>
          </Button>
        </Link>

        <button
          onClick={toggleTheme}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {userInfo && (
          <div className="flex items-center gap-2">
            {userInfo.picture && (
              <img
                src={userInfo.picture}
                alt=""
                className="h-7 w-7 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="hidden text-sm text-foreground md:inline">
              {userInfo.name}
            </span>
          </div>
        )}

        <button
          onClick={logout}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
