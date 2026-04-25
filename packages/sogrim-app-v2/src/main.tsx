import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { startAuthRefreshLoop } from "@/lib/google-auth";
import { router } from "./router";
import "./index.css";

// Don't waste retries on expired-token responses — the axios interceptor will
// have already attempted a silent refresh by the time we get here.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isAxiosError(error) && error.response?.status === 401) return false;
  return failureCount < 2;
}

const queryClient = new QueryClient({
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

startAuthRefreshLoop();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
