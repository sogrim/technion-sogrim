import { useMemo, useState } from "react";
import { Box, ThemeProvider } from "@mui/material";
import { getAppTheme } from "../../themes/theme";
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from "../../themes/constants";
import { observer } from "mobx-react-lite";
import { BannerAnonymous } from "../Banner/BannerAnonymous";
import { useStore } from "../../hooks/useStore";
import { PageState } from "../../types/ui-types";
import { FAQPage } from "../Pages/FAQPage/FAQPage";
import { ReactComponent as LandingPageSvg } from "../../assets/splashpage.svg";
const AnonymousAppComp: React.FC = () => {
  const [mode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(
    LIGHT_MODE_THEME
  );
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  const {
    uiStore: { currentPage },
  } = useStore();
  return (
    <ThemeProvider theme={theme}>
      <BannerAnonymous />
      {currentPage === PageState.FAQ ? (
        <FAQPage />
      ) : (
        <Box sx={{ m: 2, display: "flex", justifyContent: "center" }}>
          <LandingPageSvg />
        </Box>
      )}
    </ThemeProvider>
  );
};

export const AnonymousApp = observer(AnonymousAppComp);
