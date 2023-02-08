import { createTheme, responsiveFontSizes } from "@mui/material";

import { DARK_MODE_THEME, LIGHT_MODE_THEME } from "./constants";

export const getAppTheme = (
  mode: typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME
) => {
  let theme = createTheme(
    mode === LIGHT_MODE_THEME
      ? {
          // light theme
          palette: {
            mode,
            primary: {
              main: "#24333c",
              light: "#24333c",
            },
            secondary: {
              main: "#d66563",
              light: "#f0aeae",
              dark: "#853f3e",
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
        }
      : {
          // dark theme
          palette: {
            mode,
            primary: {
              main: "#5e798a",
              dark: "#0e1316",
            },
            secondary: {
              main: "#d66563",
              light: "#f0aeae",
              dark: "#853f3e",
            },
            info: {
              main: "#ff9e1e",
              light: "#743ca5",
              dark: "#743ca5",
            },
          },
          typography: {
            fontFamily: "Assistant",
            allVariants: {
              color: "#c9c9c9",
            },
          },
          components: {
            MuiButton: {
              styleOverrides: {
                root: {
                  color: "#c9c9c9",
                },
              },
            },
          },
          direction: "rtl",
        }
  );
  theme = responsiveFontSizes(theme);
  return theme;
};
