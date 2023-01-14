import { Theme, Typography } from "@mui/material";
import { LIGHT_MODE_THEME } from "../../../themes/constants";

export const AppTitle: React.FC = () => {
  return (
    <Typography variant="h4" noWrap sx={sxAppTitle}>
      {"סוגרים"}
    </Typography>
  );
};

const sxAppTitle = {
  color: (theme: Theme) =>
    theme.palette.mode === LIGHT_MODE_THEME
      ? theme.palette.primary.main
      : theme.palette.primary.contrastText,
  cursor: "default",
  ml: "80px",
  mb: "3px",
  alignContent: "center",
  fontWeight: "bold",
};
