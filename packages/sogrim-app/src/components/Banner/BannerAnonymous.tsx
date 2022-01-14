import { Box, LinearProgress, Typography } from "@mui/material";
import React from "react";

export const BannerAnonymous: React.FC = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Typography variant="h4" sx={sxAppTitle}>
        {`מחברים אותך לסוף התואר  🤓`}
      </Typography>
      <Box sx={{ width: "100%" }}>
        <LinearProgress />
      </Box>
      <div id="google-button-div"></div>
    </Box>
  );
};

const sxAppTitle = {
  fontWeight: "bold",
};
