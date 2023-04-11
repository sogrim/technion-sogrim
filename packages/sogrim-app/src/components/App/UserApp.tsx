import { CssBaseline, useTheme } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { useEffect } from "react";
import useUserState from "../../hooks/apiHooks/useUserState";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";
import { DARK_MODE_THEME } from "../../themes/constants";
import { Layout } from "../Layout/Layout";
import { ColorModeContext } from "./App";

const UserAppComp: React.FC = () => {
  const { userAuthToken } = useAuth();
  const { data, isLoading, isError, error } = useUserState(userAuthToken);
  const {
    dataStore: { initiateUser },
    uiStore: { computeUserRegistrationState },
  } = useStore();

  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);

  useEffect(() => {
    if (!isLoading && data) {
      initiateUser(data);
      computeUserRegistrationState(data.details);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isLoading, isError, error]);

  useEffect(() => {
    if (!isLoading && data) {
      if (data.settings?.dark_mode && theme.palette.mode !== DARK_MODE_THEME) {
        colorMode.toggleColorMode();
      }
    }
  });

  return (
    <>
      <CssBaseline />
      <Layout />
    </>
  );
};

export const UserApp = observer(UserAppComp);
