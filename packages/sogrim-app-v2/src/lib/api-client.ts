import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

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
