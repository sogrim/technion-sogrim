import { useMutation } from "react-query";
import { putUserSettings } from "../../services/api";
import { UserSettings } from "../../types/data-types";

export default function useUpdateUserSettings(authToken: any) {
  return useMutation(
    // "userState", // The caching key TODO: check if need this
    (updatedUserSettings: UserSettings) =>
      putUserSettings(authToken, updatedUserSettings)
  );
}
