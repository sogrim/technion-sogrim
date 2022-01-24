import { CssBaseline, ThemeProvider } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import useUserState from "../../hooks/apiHooks/useUserState";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from "../../themes/constants";
import { getAppTheme } from "../../themes/theme";
import { Layout } from "../Layout/Layout";
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

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

  // Create rtl cache
  const cacheRtl = createCache({
    key: "muirtl",
    stylisPlugins: [rtlPlugin],
  });

  return (
    <ThemeProvider theme={theme}>
      <CacheProvider value={cacheRtl}>
        <CssBaseline />
        <Layout />
      </CacheProvider>
    </ThemeProvider>
  );
};

export const UserApp = observer(UserAppComp);
