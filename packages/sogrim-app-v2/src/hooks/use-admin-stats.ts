import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

/** Fetches the admin BI dashboard stats from `GET /admins/stats`. Mirrors the
 *  server's ~5min TTL cache, so we hold the result stale for 5 minutes. */
export function useAdminStats() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["adminStats"],
    queryFn: getAdminStats,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
