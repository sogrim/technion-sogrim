import React from "react";

import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import useComputeEndGame from "../../../../hooks/apiHooks/useComputeEndGame";
import { useAuth } from "../../../../hooks/useAuth";
import { IntroStepCard } from "../IntroStepCard";

export const TriggerCompute: React.FC = () => {
  const [triggerCompute, setTriggerCompute] = React.useState(false);
  const [backdropOpen, setBackdropOpen] = React.useState(false);

  const { userAuthToken } = useAuth();

  const { isLoading } = useComputeEndGame(userAuthToken, triggerCompute);

  const handleClick = () => {
    setBackdropOpen(true);
    setTriggerCompute(true);
  };

  return (
    <>
      <IntroStepCard>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "30px",
            p: "30px",
          }}
        >
          <Typography variant="h4"> הכל כבר מוכן! </Typography>
          <Button
            size="large"
            onClick={handleClick}
            variant="contained"
            sx={{ mt: 1, msScrollLimitXMin: 1 }}
          >
            לסגור את התואר!
          </Button>
        </Box>
      </IntroStepCard>
      {isLoading && (
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={backdropOpen}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
    </>
  );
};
