import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";
import { refreshGoogleToken } from "./google-auth";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.authorization = token;
  }
  return config;
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      const refreshed = await refreshGoogleToken();
      if (refreshed) {
        const newToken = useAuthStore.getState().token;
        if (newToken) {
          original.headers.authorization = newToken;
          return apiClient(original);
        }
      }
      // Couldn't recover the session — drop the user back to the login screen.
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
