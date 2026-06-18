import { Link, useLocation } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { RESOURCES } from "@/resources/registry";

export function Sidebar() {
  const location = useLocation();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col overflow-y-auto border-e bg-card shadow-sm transition-all duration-300 ease-in-out",
        collapsed ? "w-16 p-2" : "w-[220px] p-4",
      )}
    >
      <div className={cn("mb-6 flex items-center gap-2", collapsed ? "justify-center px-0" : "px-2")}>
        <ShieldCheck className="size-6 shrink-0" style={{ color: "var(--banner)" }} />
        {!collapsed && (
          <div className="leading-tight">
            <div className="text-sm font-bold">Sogrim</div>
            <div className="text-xs text-muted-foreground">Back Office</div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        {RESOURCES.map((item) => {
          const base = `/${item.key}`;
          const isActive =
            location.pathname === base || location.pathname.startsWith(`${base}/`);
          return (
            <Link
              key={item.key}
              to="/$resource"
              params={{ resource: item.key }}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="size-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="mt-auto flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronLeft className="size-5 rtl:rotate-180" />
        ) : (
          <ChevronRight className="size-5 rtl:rotate-180" />
        )}
      </button>
    </aside>
  );
}
