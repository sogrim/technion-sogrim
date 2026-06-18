import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "@/stores/auth-store";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

let gsiInitialized = false;
let inflightRefresh: Promise<boolean> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function waitForGoogleScript(timeoutMs = 5000): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });
}

/** Initialize Google Identity Services exactly once. Idempotent. */
export async function ensureGsiInitialized(): Promise<boolean> {
  if (gsiInitialized) return true;
  await waitForGoogleScript();
  if (!window.google?.accounts?.id) return false;
  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    auto_select: true,
    callback: (response: { credential?: string }) => {
      if (response.credential) {
        useAuthStore.getState().setCredential(response.credential);
      }
    },
  });
  gsiInitialized = true;
  return true;
}

/**
 * Trigger Google's One Tap prompt and wait for either a fresh credential to
 * land in the auth store, or a failure notification / timeout. Single-flight:
 * concurrent callers share one in-flight refresh.
 *
 * Returns true on success (a new token is now in the store), false otherwise.
 */
export function refreshGoogleToken(): Promise<boolean> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = (async () => {
    const ok = await ensureGsiInitialized();
    if (!ok || !window.google?.accounts?.id) return false;
    const initialToken = useAuthStore.getState().token;
    return new Promise<boolean>((resolve) => {
      let done = false;
      const finish = (success: boolean) => {
        if (done) return;
        done = true;
        unsubscribe();
        resolve(success);
      };
      const unsubscribe = useAuthStore.subscribe((state) => {
        if (state.token && state.token !== initialToken) finish(true);
      });
      window.google!.accounts.id.prompt((notification: unknown) => {
        const n = notification as PromptMomentNotification;
        if (
          n.isDismissedMoment?.() ||
          n.isSkippedMoment?.() ||
          n.isNotDisplayed?.()
        ) {
          finish(false);
        }
      });
      setTimeout(() => finish(false), 8000);
    });
  })().finally(() => {
    inflightRefresh = null;
  });
  return inflightRefresh;
}

/**
 * Schedule a silent refresh ~5 minutes before the current token expires.
 * Subscribes to auth-store changes so the timer is reset whenever the token
 * is replaced (login, refresh) or cleared (logout).
 */
function scheduleProactiveRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  const { token } = useAuthStore.getState();
  if (!token) return;
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    if (!decoded.exp) return;
    const refreshAt = decoded.exp * 1000 - 5 * 60 * 1000;
    const delay = Math.max(0, refreshAt - Date.now());
    refreshTimer = setTimeout(() => {
      void refreshGoogleToken();
    }, delay);
  } catch {
    /* ignore decode errors */
  }
}

/** Wire up the proactive refresh timer. Call once during app boot. */
export function startAuthRefreshLoop() {
  scheduleProactiveRefresh();
  useAuthStore.subscribe(() => scheduleProactiveRefresh());
}

interface PromptMomentNotification {
  isDisplayMoment?: () => boolean;
  isDisplayed?: () => boolean;
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  isDismissedMoment?: () => boolean;
}
