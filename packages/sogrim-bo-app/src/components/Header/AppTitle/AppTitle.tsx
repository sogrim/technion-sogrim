import { Theme, Typography } from "@mui/material";

export const AppTitle: React.FC = () => {
  return (
    <Typography variant="h4" noWrap sx={sxAppTitle}>
      {"סוגרים | לוח הבקרה"}
    </Typography>
  );
};

const sxAppTitle = {
  color: (theme: Theme) => theme.palette.primary.main,
  cursor: "default",
  ml: "50px",
  mb: "3px",
  alignContent: "center",
  fontWeight: "bold",
};
