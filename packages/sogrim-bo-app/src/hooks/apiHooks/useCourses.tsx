import { useQuery } from "react-query";
import { getCourses } from "../../services/api";

export default function useUserState(
  authToken: any = undefined,
  trigger: boolean = true
) {
  return useQuery<any>("courses", () => getCourses(authToken), {
    enabled: !!authToken && trigger,
    staleTime: Infinity,
  });
}
