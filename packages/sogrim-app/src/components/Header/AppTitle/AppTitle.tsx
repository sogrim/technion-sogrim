import { Theme, Typography } from "@mui/material";

export const AppTitle: React.FC = () => {
  return (
    <Typography variant="h4" noWrap sx={sxAppTitle}>
      {"סוגרים"}
    </Typography>
  );
};

const sxAppTitle = {
  color: (theme: Theme) => theme.palette.primary.main,
  cursor: "default",
  mr: "80px",
  mb: "3px",
  alignContent: "center",
  fontWeight: "bold",
};
