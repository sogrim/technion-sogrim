import { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

// Don't waste retries on expired-token responses — the axios interceptor will
// have already attempted a silent refresh by the time we get here.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isAxiosError(error) && error.response?.status === 401) return false;
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: shouldRetry,
    },
  },
});
