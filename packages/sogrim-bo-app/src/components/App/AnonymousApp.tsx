import { useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material";
import { getAppTheme } from "../../themes/theme";
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from "../../themes/constants";
import { observer } from "mobx-react-lite";
import { useStore } from "../../hooks/useStore";

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
      <h1> שלום עולם</h1>
    </ThemeProvider>
  );
};

export const AnonymousApp = observer(AnonymousAppComp);
