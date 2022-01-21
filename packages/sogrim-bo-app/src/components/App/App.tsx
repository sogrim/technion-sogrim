import { ThemeProvider } from "@mui/material";
import jwtDecode from "jwt-decode";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from "../../themes/constants";
import { getAppTheme } from "../../themes/theme";
import { GoogleClinetSession as GoogleClientSession } from "../../types/auth-types";
import { Footer } from "../Footer/Footer";
import GoogleAuth from "../GoogleAuth/GoogleAuth";
import { AnonymousApp } from "./AnonymousApp";

const AppComp: React.FC = () => {
  const [mode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(
    LIGHT_MODE_THEME
  );

  const {
    uiStore: { setUserDisplay },
  } = useStore();
  const { isAuthenticated, googleSession, userAuthToken } = useAuth();

  useEffect(() => {
    if (googleSession === GoogleClientSession.DONE) {
      if (userAuthToken) {
        setUserDisplay(jwtDecode(userAuthToken));
      }
    }
  }, [isAuthenticated, googleSession, userAuthToken, setUserDisplay]);

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <GoogleAuth />
      {isAuthenticated ? <> שלום</> : <AnonymousApp />}
      <Footer />
    </ThemeProvider>
  );
};

export const App = observer(AppComp);
