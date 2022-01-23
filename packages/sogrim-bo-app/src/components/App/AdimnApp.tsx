import { CircularProgress, CssBaseline, ThemeProvider } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import useCourses from "../../hooks/apiHooks/useCourses";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from "../../themes/constants";
import { getAppTheme } from "../../themes/theme";
import { Layout } from "../Layout/Layout";
import { ErrorToast } from "../Toasts/ErrorToast";
import { InfoToast } from "../Toasts/InfoToast";

const AdminAppComp: React.FC = () => {
  const [mode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(
    LIGHT_MODE_THEME
  );
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  const {
    dataStore: { setCourses },
  } = useStore();

  const { userAuthToken } = useAuth();

  const { data, isLoading } = useCourses(userAuthToken);
  useEffect(() => {
    setCourses(data);
  }, [data, setCourses]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isLoading ? <CircularProgress /> : <Layout />}
      <ErrorToast />
      <InfoToast />
    </ThemeProvider>
  );
};

export const AdminApp = observer(AdminAppComp);
