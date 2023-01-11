import { Box, LinearProgress, Typography } from "@mui/material";
import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { FallbackProps } from "react-error-boundary";
import { GoogleAuth } from "../../GoogleAuth/GoogleAuth";

export const FallbackPage: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const statusCode = (error as AxiosError<unknown>).response?.status;

  const [loginReady, setLoginReady] = useState(false);

  useEffect(() => {
    if (statusCode === 401 && loginReady) {
      resetErrorBoundary();
    }
  }, [loginReady, resetErrorBoundary, statusCode]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        mt: 40,
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
          <Typography
            sx={{ display: "flex", justifySelf: "center" }}
            variant="h6"
          >
            אם הדף לא עובר אוטומטית לעמוד הראשי בעוד כמה שניות, נסו ללחוץ על
            ההתחברות דרך גוגל למעלה.
          </Typography>
          <GoogleAuth onLogin={() => setLoginReady(true)} />
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
