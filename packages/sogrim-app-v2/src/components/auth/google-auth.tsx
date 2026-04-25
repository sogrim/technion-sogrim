import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { ensureGsiInitialized, refreshGoogleToken } from "@/lib/google-auth";

export function GoogleAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkAndRefresh = useAuthStore((s) => s.checkAndRefresh);

  useEffect(() => {
    void ensureGsiInitialized().then((ready) => {
      if (!ready) return;
      // If the persisted token has already expired, ask Google for a fresh one.
      if (!checkAndRefresh()) {
        void refreshGoogleToken();
      }
    });
  }, [isAuthenticated, checkAndRefresh]);

  return null;
}

export function GoogleSignInButton() {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buttonRef.current) return;
    void ensureGsiInitialized().then((ready) => {
      if (!ready || !buttonRef.current) return;
      window.google!.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        size: "large",
        theme: "outline",
        text: "signin_with",
        locale: "he",
      });
    });
  }, []);

  return <div ref={buttonRef} />;
}
