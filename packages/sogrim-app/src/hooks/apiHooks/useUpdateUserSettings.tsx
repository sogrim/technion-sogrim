import { AxiosError } from "axios";
import { useMutation } from "react-query";
import { putUserSettings } from "../../services/api";
import { UserSettings } from "../../types/data-types";

export default function useUpdateUserSettings(authToken: any) {
  return useMutation<{}, AxiosError<unknown>, UserSettings>(
    // "userState", // The caching key TODO: check if need this
    (updatedUserSettings: UserSettings) =>
      putUserSettings(authToken, updatedUserSettings),
    { useErrorBoundary: true }
  );
}
