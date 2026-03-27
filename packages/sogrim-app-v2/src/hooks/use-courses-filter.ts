import { useQuery } from "@tanstack/react-query";
import { getCourseByFilter } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useCoursesFilter(filterName: string, filter: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["coursesByFilter", filterName, filter],
    queryFn: () => getCourseByFilter(filterName, filter),
    enabled: isAuthenticated && filter.length > 0,
    staleTime: 30 * 1000,
  });
}
