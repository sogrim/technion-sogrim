import { Box, Typography } from "@mui/material";
import React from "react";
import { Header } from "../Header/Header";

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
      <Header />
      <Typography variant="h4" sx={sxAppTitle}>
        {`מחברים אותך לסוף התואר  🤓`}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          marginTop: 5,
        }}
      >
        <Typography variant="h6"> התחבר באמצעות גוגל</Typography>
        <div id="google-button-div" className={"g_id_signin"}></div>
      </Box>
    </Box>
  );
};

const sxAppTitle = {
  fontWeight: "bold",
};
