import { useQuery } from "@tanstack/react-query";
import { getCatalogs } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useCatalogs(faculty?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["catalogs", faculty],
    queryFn: () => getCatalogs(faculty),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
