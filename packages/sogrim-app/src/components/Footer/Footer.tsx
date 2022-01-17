import GitHubIcon from "@mui/icons-material/GitHub";
import { AppBar, Box, Link, Typography } from "@mui/material";

export const Footer: React.FC = () => {
  return (
    <AppBar
      position="fixed"
      color="primary"
      sx={{
        top: "auto",
        justifyContent: "center",
        bottom: 0,
        minHeight: "35px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <Typography> מוגש בחום ואהבה מצוות סוגרים 🤓</Typography>
        <Box
          sx={{
            display: "flex",
            gap: 0.75,
            alignItems: "center",
          }}
        >
          <Link
            href="https://github.com/sogrim/technion-sogrim"
            underline="hover"
            target="_blank"
            rel="noopener"
            color="white"
          >
            Github
          </Link>
          <GitHubIcon sx={{ height: "18px", width: "18px" }} />
        </Box>
      </Box>
    </AppBar>
  );
};
