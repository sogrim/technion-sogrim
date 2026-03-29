import { useQuery } from "@tanstack/react-query";
import { getUserState } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useUserState() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["userState"],
    queryFn: getUserState,
    enabled: isAuthenticated,
    staleTime: Infinity,
  });
}
