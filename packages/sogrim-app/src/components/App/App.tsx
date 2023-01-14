import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import jwtDecode from "jwt-decode";
import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useState } from "react";
import { isMobile } from "react-device-detect";
import { ErrorBoundary } from "react-error-boundary";
import rtlPlugin from "stylis-plugin-rtl";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from "../../themes/constants";
import { getAppTheme } from "../../themes/theme";
import { GoogleClientSession } from "../../types/auth-types";
import { Footer } from "../Footer/Footer";
import { GoogleAuth } from "../GoogleAuth/GoogleAuth";
import { FallbackPage } from "../Pages/FallbackPage/FallbackPage";
import { AnonymousApp } from "./AnonymousApp";
import { MobilePage } from "./MobilePage";
import { UserApp } from "./UserApp";

export const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
});

const AppComp: React.FC = () => {
  const [mode, setMode] = useState<
    typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME
  >(LIGHT_MODE_THEME);
  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) =>
          prevMode === LIGHT_MODE_THEME ? DARK_MODE_THEME : LIGHT_MODE_THEME
        );
      },
    }),
    []
  );
  const theme = useMemo(() => getAppTheme(mode), [mode]);
  const matches = useMediaQuery(theme.breakpoints.up("sm"));

  const {
    uiStore: { setUserDisplay, goToMainPage },
  } = useStore();
  const { isAuthenticated, googleSession, userAuthToken } = useAuth();

  useEffect(() => {
    if (!isMobile || !matches) {
      if (googleSession === GoogleClientSession.DONE) {
        goToMainPage();
        if (userAuthToken) {
          setUserDisplay(jwtDecode(userAuthToken));
        }
      }
    }
    // TODO check
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, googleSession, userAuthToken, setUserDisplay]);

  // Create rtl cache
  const cacheRtl = createCache({
    key: "muirtl",
    stylisPlugins: [rtlPlugin],
  });

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CacheProvider value={cacheRtl}>
          {isMobile || !matches ? (
            <MobilePage />
          ) : (
            <>
              <GoogleAuth />
              <ErrorBoundary FallbackComponent={FallbackPage}>
                {isAuthenticated ? <UserApp /> : <AnonymousApp />}
                <Footer />
              </ErrorBoundary>
            </>
          )}
        </CacheProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export const App = observer(AppComp);
