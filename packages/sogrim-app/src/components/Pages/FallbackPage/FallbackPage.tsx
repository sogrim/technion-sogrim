import { Box, LinearProgress, Typography } from "@mui/material";
import { AxiosError } from "axios";
import React, { useEffect } from "react";
import { FallbackProps } from "react-error-boundary";

export const FallbackPage: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const statusCode = (error as AxiosError<unknown>).response?.status;

  useEffect(() => {
    if (statusCode === 401) {
      setTimeout(() => {
        resetErrorBoundary();
      }, 1500);
    }
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        mt: 20,
        gap: 5,
        alignItems: "center",
      }}
    >
      {statusCode === 401 && (
        <>
          <Typography
            sx={{ display: "flex", justifySelf: "center" }}
            variant="h2"
          >
            פג תוקף ההתחברות, כבר מחברים אותך מחדש...
          </Typography>
          <LinearProgress
            sx={{ width: "100%", height: 30 }}
            color="secondary"
          />
        </>
      )}
      {statusCode && statusCode >= 500 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography fontSize={"200px"} color="error">
            {statusCode}
          </Typography>
          <Typography variant="h3">
            נראה שיש בעיה בשרת, אנא נסו שוב מאוחר יותר 😕
          </Typography>
        </Box>
      )}
    </Box>
  );
};
