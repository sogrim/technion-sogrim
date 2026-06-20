import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { isAuthorizationError } from "@/lib/api-errors";
import { startAuthRefreshLoop } from "@/lib/google-auth";
import { USE_MOCKS } from "@/data/provider";
import { router } from "./router";
import "./index.css";

function shouldRetry(failureCount: number, error: unknown): boolean {
  // Never retry permission failures or token failures — neither will recover
  // by retrying (the interceptor already attempted a silent token refresh).
  if (isAuthorizationError(error)) return false;
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

if (!USE_MOCKS) {
  startAuthRefreshLoop();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
