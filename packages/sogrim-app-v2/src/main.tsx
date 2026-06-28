import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { startAuthRefreshLoop } from "@/lib/google-auth";
import { queryClient } from "@/lib/query-client";
import { router } from "./router";
import "./index.css";

startAuthRefreshLoop();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200} skipDelayDuration={300}>
          <RouterProvider router={router} />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
