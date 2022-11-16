import { useMutation } from "react-query";
import { putUserState } from "../../services/api";
import { UserDetails } from "../../types/data-types";

export default function useUpdateUserState(authToken: any) {
  return useMutation(
    "userState", // The caching key
    (updatedUserState: UserDetails) =>
      putUserState(authToken, updatedUserState),
    { useErrorBoundary: true }
  );
}
