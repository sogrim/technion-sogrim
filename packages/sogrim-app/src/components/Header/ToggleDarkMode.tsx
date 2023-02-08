import { DarkMode, LightMode } from "@mui/icons-material";
import { IconButton, useTheme } from "@mui/material";
import { useContext } from "react";
import useUpdateUserSettings from "../../hooks/apiHooks/useUpdateUserSettings";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";

import { DARK_MODE_THEME } from "../../themes/constants";
import { ColorModeContext } from "../App/App";

export const ToggleDarkMode: React.FC = () => {
  const {
    dataStore: { toggleDarkMode },
  } = useStore();

  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const { isAuthenticated, userAuthToken } = useAuth();
  const { mutate } = useUpdateUserSettings(userAuthToken);

  const handleToggle = () => {
    colorMode.toggleColorMode();
    if (isAuthenticated) {
      let newUserSettings = toggleDarkMode();
      mutate(newUserSettings);
    }
  };

  return (
    <IconButton onClick={() => handleToggle()}>
      {theme.palette.mode === DARK_MODE_THEME ? <LightMode /> : <DarkMode />}
    </IconButton>
  );
};
