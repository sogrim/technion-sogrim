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
  const { data, isLoading } = useUserState(userAuthToken);
  const {
    dataStore: { updateStoreUserDetails },
    uiStore: { computeUserRegistrationState, userRegistrationState },
  } = useStore();

  useEffect(() => {
    if (!isLoading && data) {
      updateStoreUserDetails(data.details);
    }
  }, [
    data,
    updateStoreUserDetails,
    isLoading,
    userRegistrationState,
    computeUserRegistrationState,
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout />
    </ThemeProvider>
  );
};

export const UserApp = observer(UserAppComp);
