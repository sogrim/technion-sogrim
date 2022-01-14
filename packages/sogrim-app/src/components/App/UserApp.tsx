import { useEffect, useMemo, useState } from "react";
import { CssBaseline, ThemeProvider, Alert } from "@mui/material";
import { Layout } from "../Layout/Layout";
import { getAppTheme } from "../../themes/theme";
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from "../../themes/constants";
import { observer } from "mobx-react-lite";
import { useAuth } from "../../hooks/useAuth";
import useUserState from "../../hooks/apiHooks/useUserState";
import { useStore } from "../../hooks/useStore";

const UserAppComp: React.FC = () => {
  const [mode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(
    LIGHT_MODE_THEME
  );
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  const { userAuthToken } = useAuth();
  const { data, isLoading } = useUserState(userAuthToken);
  const {
    dataStore: { updateStoreUserDetails },
  } = useStore();

  useEffect(() => {
    if (!isLoading && data) {
      console.log("im here ya ben zona");
      updateStoreUserDetails(data.details);
    }
  }, [data, updateStoreUserDetails, isLoading]);

  console.log("~~~", isLoading);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout />
    </ThemeProvider>
  );
};

export const UserApp = observer(UserAppComp);
