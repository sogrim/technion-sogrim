import { CssBaseline, ThemeProvider } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import useUserState from "../../hooks/apiHooks/useUserState";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from "../../themes/constants";
import { getAppTheme } from "../../themes/theme";
import { Layout } from "../Layout/Layout";

const UserAppComp: React.FC = () => {
  const [mode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(
    LIGHT_MODE_THEME
  );
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  const { userAuthToken } = useAuth();
  const { data, isLoading, isError, error } = useUserState(userAuthToken);
  const {
    dataStore: { updateStoreUserDetails, updateStoreUserSettings },
    uiStore: { computeUserRegistrationState, userRegistrationState },
  } = useStore();

  useEffect(() => {
    if (!isLoading && data) {
      updateStoreUserDetails(data.details);
      updateStoreUserSettings(data.settings);
    }
  }, [
    data,
    updateStoreUserDetails,
    updateStoreUserSettings,
    isLoading,
    userRegistrationState,
    computeUserRegistrationState,
    isError,
    error,
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout />
    </ThemeProvider>
  );
};

export const UserApp = observer(UserAppComp);
