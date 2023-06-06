import { useQuery, useQueryClient } from "react-query";
import { getComputeEndGame } from "../../services/api";
import { UserState } from "../../types/data-types";

export default function useComputeEndGame(
  authToken: any,
  trigger: boolean = false
) {
  const queryClient = useQueryClient();

  return useQuery("userEndGame", () => getComputeEndGame(authToken), {
    enabled: !!authToken && trigger,
    useErrorBoundary: true,
    onSuccess: (newData: UserState) => {
      queryClient.setQueryData("userState", () => {
        const current = newData;
        return current;
      });
    },
  });
}
