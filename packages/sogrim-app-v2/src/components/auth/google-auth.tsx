import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export function GoogleAuth() {
  const initialized = useRef(false);
  const setCredential = useAuthStore((s) => s.setCredential);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkAndRefresh = useAuthStore((s) => s.checkAndRefresh);

  useEffect(() => {
    if (!window.google) return;

    // Check if existing token is still valid
    const tokenValid = checkAndRefresh();

    // Only initialize GSI once
    if (!initialized.current) {
      initialized.current = true;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        auto_select: true,
        callback: (response: { credential?: string }) => {
          if (response.credential) {
            setCredential(response.credential);
          }
        },
      });
    }

    // Only show the One Tap prompt if NOT authenticated or token expired
    if (!tokenValid) {
      window.google.accounts.id.prompt(() => {});
    }
  }, [setCredential, isAuthenticated, checkAndRefresh]);

  return null;
}

export function GoogleSignInButton() {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      auto_select: true,
      callback: (response: { credential?: string }) => {
        if (response.credential) {
          useAuthStore.getState().setCredential(response.credential);
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      size: "large",
      theme: "outline",
      text: "signin_with",
      locale: "he",
    });
  }, []);

  return <div ref={buttonRef} />;
}
