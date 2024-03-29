import { Box, CircularProgress } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { useStore } from "../../hooks/useStore";
import { UserRegistrationState } from "../../types/ui-types";
import { Intro } from "../Intro/Intro";
import { PagesTabs } from "./PagesTabs";

const AppPagesComp: React.FC = () => {
  const {
    uiStore: { userRegistrationState },
  } = useStore();

  return (
    <Box sx={sxPages}>
      {userRegistrationState === UserRegistrationState.Loading ? (
        <CircularProgress />
      ) : userRegistrationState === UserRegistrationState.Ready ? (
        <PagesTabs />
      ) : (
        <Box sx={{ flexDirection: "column" }}>
          <Intro />
        </Box>
      )}
    </Box>
  );
};

export const AppPages = observer(AppPagesComp);

const sxPages = {
  width: "100%",
  marginTop: "20px",
  display: "flex",
  justifyContent: "center",
};
