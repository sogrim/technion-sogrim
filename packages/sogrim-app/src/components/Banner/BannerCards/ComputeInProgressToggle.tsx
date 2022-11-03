import { Typography, Switch, Tooltip, Box } from "@mui/material";
import { useEffect } from "react";
import { useStore } from "../../../hooks/useStore";
import useUpdateUserSettings from "../../../hooks/apiHooks/useUpdateUserSettings";
import { useAuth } from "../../../hooks/useAuth";

export const ComputeInProgressToggle: React.FC<{
  computeInProgress: boolean;
  setComputeInProgress: any;
}> = ({ computeInProgress, setComputeInProgress }) => {
  const {
    dataStore: { updateComputeInProgressInUserSettings },
  } = useStore();

  const { userAuthToken } = useAuth();
  const { mutate, isError, error } = useUpdateUserSettings(userAuthToken);

  useEffect(() => {}, [isError, error]);

  const handleChange = (
    _: React.SyntheticEvent,
    computeInProgress: boolean
  ) => {
    setComputeInProgress(computeInProgress);
    let newUserSettings =
      updateComputeInProgressInUserSettings(computeInProgress);
    mutate(newUserSettings);
  };

  return (
    <Tooltip
      arrow
      title={
        "כפתור זה מאפשר לכם לחשב את סטטוס התואר שלכם עם התחשבות בקורסים שעוד אין להם ציון (בתהליך)"
      }
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "-10px",
        }}
      >
        <Typography fontSize={10}>התחשב בקורסים בתהליך</Typography>
        <Switch
          onChange={handleChange}
          checked={computeInProgress}
          color="secondary"
          size="small"
        />
      </Box>
    </Tooltip>
  );
};
