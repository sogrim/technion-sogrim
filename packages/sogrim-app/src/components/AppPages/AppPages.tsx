import { Box, CircularProgress } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import useUserState from "../../hooks/apiHooks/useUserState";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";
import { UserRegistrationState } from "../../types/ui-types";
import { AppStepper } from "../Banner/AppStepper";
import { PagesTabs } from "./PagesTabs";

const AppPagesComp: React.FC = () => {
  const {
    uiStore: { userRegistrationState, computeUserRegistrationState },
  } = useStore();

  const { userAuthToken } = useAuth();
  const { data, isLoading, refetch } = useUserState(userAuthToken);

  React.useEffect(() => {
    const refreshStepper = async () => {
      if (data && !isLoading) {
        const { data: newData } = await refetch();
        if (newData) {
          computeUserRegistrationState(newData.details);
        }
      }
    };
    refreshStepper();
  }, [
    computeUserRegistrationState,
    data,
    isLoading,
    refetch,
    userRegistrationState,
  ]);

  return (
    <Box sx={sxPages}>
      {userRegistrationState === UserRegistrationState.Loading ? (
        <CircularProgress />
      ) : userRegistrationState === UserRegistrationState.Ready ? (
        <PagesTabs />
      ) : (
        <AppStepper />
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
