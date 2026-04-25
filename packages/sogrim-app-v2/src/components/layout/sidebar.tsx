import { Link, useLocation } from "@tanstack/react-router";
import { GraduationCap, Calendar, Settings, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

const navItems = [
  { to: "/planner" as const, label: "מעקב תואר", icon: GraduationCap },
  { to: "/timetable" as const, label: "מערכת שעות", icon: Calendar },
  { to: "/settings" as const, label: "הגדרות", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen border-e bg-card flex flex-col shadow-sm transition-all duration-300 ease-in-out overflow-y-auto",
        collapsed ? "w-16 p-2" : "w-[220px] p-4"
      )}
    >
      <div className={cn("mb-6", collapsed ? "px-0 text-center" : "px-2")}>
        <h1
          className={cn("font-bold transition-all duration-300 text-foreground", collapsed ? "text-sm" : "text-xl")}
        >
          {collapsed ? <GraduationCap className="h-6 w-6" style={{ color: "var(--banner)" }} /> : "סוגרים"}
        </h1>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="mt-auto flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        aria-label={collapsed ? "הרחב תפריט צד" : "צמצם תפריט צד"}
      >
        {collapsed ? (
          <ChevronLeft className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </button>
    </aside>
  );
}
