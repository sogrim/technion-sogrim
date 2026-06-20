import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { GoogleAuth } from "@/components/auth/google-auth";
import { BoLogin } from "@/components/auth/bo-login";
import { CommandMenu } from "@/components/bo/command-menu";
import { USE_MOCKS } from "@/data/provider";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Mock mode runs without login; otherwise gate the whole app behind Google
  // sign-in. (Real authorization is always enforced server-side.)
  if (!USE_MOCKS && !isAuthenticated) {
    return (
      <>
        <GoogleAuth />
        <BoLogin />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!USE_MOCKS && <GoogleAuth />}
      <CommandMenu />
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
