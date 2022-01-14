import { useMutation, useQueryClient } from "react-query";
import { postUserUgData } from "../../services/api";
import { UserState } from "../../types/data-types";

export default function useUpdateUserUgData(authToken: any) {
  const queryClient = useQueryClient();

  return useMutation(
    "ugData",
    (ugData: string) => postUserUgData(authToken, ugData),
    {
      onSuccess: (newData: UserState) => {
        queryClient.setQueryData("userState", () => {
          const current = newData;
          return current;
        });
      },
    }
  );
}
