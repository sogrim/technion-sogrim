import { Link, useLocation } from "@tanstack/react-router";
import { GraduationCap, Calendar, Settings, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/planner" as const, label: "תואר", icon: GraduationCap },
  { to: "/timetable" as const, label: "מערכת", icon: Calendar },
  { to: "/settings" as const, label: "הגדרות", icon: Settings },
  { to: "/contact" as const, label: "קשר", icon: Mail },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={cn(
                "flex items-center justify-center px-3 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon
                className={cn("h-5 w-5", isActive && "text-primary")}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
