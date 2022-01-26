import { createTheme, responsiveFontSizes } from "@mui/material";

import { DARK_MODE_THEME, LIGHT_MODE_THEME } from "./constants";

export const getAppTheme = (
  mode: typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME
) => {
  let theme = createTheme({
    palette: {
      mode,
      primary: {
        main: "#24333c",
        light: "##24333c",
      },
      secondary: {
        main: "#d66563",
        light: "##efc1c1",
        dark: "#ab514f",
      },
      info: {
        main: "#743ca5",
        light: "#743ca5",
        dark: "#743ca5",
      },
    },
    typography: {
      fontFamily: "Assistant",
    },
    direction: "rtl",
  });
  theme = responsiveFontSizes(theme);
  return theme;
};
