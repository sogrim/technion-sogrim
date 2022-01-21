import { ThemeProvider } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from "../../themes/constants";
import { getAppTheme } from "../../themes/theme";
import { Header } from "../Header/Header";

const AdminAppComp: React.FC = () => {
  const [mode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(
    LIGHT_MODE_THEME
  );
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <Header />
    </ThemeProvider>
  );
};

export const AdminApp = observer(AdminAppComp);
