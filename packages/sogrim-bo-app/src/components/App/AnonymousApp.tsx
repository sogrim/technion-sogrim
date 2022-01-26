import { useMemo, useState } from "react";
import { ThemeProvider, Typography, Box } from "@mui/material";
import { getAppTheme } from "../../themes/theme";
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from "../../themes/constants";
import { observer } from "mobx-react-lite";
import { useStore } from "../../hooks/useStore";
import { Header } from "../Header/Header";

const AnonymousAppComp: React.FC = () => {
  const [mode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(
    LIGHT_MODE_THEME
  );
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  const {
    uiStore: {},
  } = useStore();

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Header />
        <Typography variant="h4" sx={sxAppTitle}>
          {`מחברים אותך לסוף התואר  🤓`}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginTop: 5,
          }}
        >
          <Typography variant="h6"> התחבר באמצעות גוגל</Typography>
          <div id="google-button-div" className={"g_id_signin"}></div>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export const AnonymousApp = observer(AnonymousAppComp);

const sxAppTitle = {
  fontWeight: "bold",
};
