import { Box, Typography } from "@mui/material";
import React from "react";

export const RegistrationBanner = () => {
  return (
    <Box
      sx={{
        display: "flex",
        textAlign: "center",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <Typography variant="h3" color="white">
        פה סוגרים את התואר!
      </Typography>
      <Typography variant="h5" color="white">
        בחרו קטלוג, ייבאו קורסים ואז תגלו - כמה עוד?!
      </Typography>
    </Box>
  );
};
