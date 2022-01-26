import {
  Box,
  CircularProgress,
  CssBaseline,
  ThemeProvider,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import useCatalogs from "../../hooks/apiHooks/useCatalogs";
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
    dataStore: { setCourses, setCatalogsIds },
  } = useStore();

  const { userAuthToken } = useAuth();

  const { data: courses, isLoading: coursesLoading } =
    useCourses(userAuthToken);
  const { data: catalogsIds, isLoading: catalogLoading } =
    useCatalogs(userAuthToken);

  useEffect(() => {
    setCourses(courses);
    setCatalogsIds(catalogsIds);
  }, [catalogsIds, courses, setCatalogsIds, setCourses]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {coursesLoading && catalogLoading ? (
        <Box>
          <CircularProgress />
        </Box>
      ) : (
        <Layout />
      )}
      <ErrorToast />
      <InfoToast />
    </ThemeProvider>
  );
};

export const AdminApp = observer(AdminAppComp);
