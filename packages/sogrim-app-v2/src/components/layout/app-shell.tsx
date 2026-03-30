import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useApiProvider } from "@/hooks/use-api-provider";
import { GoogleAuth } from "@/components/auth/google-auth";
import { AnonymousPage } from "@/components/auth/anonymous-page";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Header } from "./header";

interface AppShellProps {
  children: ReactNode;
}

function AuthenticatedShell({ children }: { children: ReactNode }) {
  // Initialize course schedule provider globally so it's available on all pages
  useApiProvider();

  return (
    <div className="min-h-screen bg-background">
      <GoogleAuth />

      {/* Desktop: sidebar + header + content */}
      <div className="hidden md:flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>

      {/* Mobile: header + content + bottom nav */}
      <div className="flex flex-col min-h-screen md:hidden">
        <Header />
        <main className="flex-1 p-4 pb-20">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <>
        <GoogleAuth />
        <AnonymousPage />
      </>
    );
  }

  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
