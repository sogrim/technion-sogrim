import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";

interface UserInfo {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

interface JwtPayload extends UserInfo {
  exp?: number;
}

interface AuthState {
  token: string | null;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  setCredential: (credential: string) => void;
  logout: () => void;
  isTokenExpired: () => boolean;
  checkAndRefresh: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userInfo: null,
      isAuthenticated: false,
      setCredential: (credential: string) => {
        try {
          const decoded = jwtDecode<JwtPayload>(credential);
          set({
            token: credential,
            userInfo: decoded,
            isAuthenticated: true,
          });
        } catch {
          set({ token: null, userInfo: null, isAuthenticated: false });
        }
      },
      logout: () => {
        set({ token: null, userInfo: null, isAuthenticated: false });
        window.google?.accounts.id.disableAutoSelect();
      },
      isTokenExpired: () => {
        const { token } = get();
        if (!token) return true;
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          if (!decoded.exp) return false;
          // Token expired if less than 60 seconds remaining
          return decoded.exp * 1000 < Date.now() - 60000;
        } catch {
          return true;
        }
      },
      // Returns true if token is still valid, false if needs re-auth
      checkAndRefresh: () => {
        const { isTokenExpired, token } = get();
        if (!token || isTokenExpired()) {
          // Token expired - clear auth so Google prompt shows
          set({ token: null, userInfo: null, isAuthenticated: false });
          return false;
        }
        return true;
      },
    }),
    {
      name: "sogrim-auth",
    }
  )
);
