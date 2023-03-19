import { Theme, Typography } from "@mui/material";
import { useStore } from "../../../hooks/useStore";
import { LIGHT_MODE_THEME } from "../../../themes/constants";
import { UserPermissions } from "../../../types/data-types";

export const AppTitle: React.FC<{ permission: UserPermissions }> = ({
  permission,
}) => {
  const content =
    permission === UserPermissions.Admin || permission === UserPermissions.Owner
      ? "סוגרים - ניהול מערכת"
      : "סוגרים";

  return (
    <Typography variant="h4" noWrap sx={sxAppTitle}>
      {content}
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
