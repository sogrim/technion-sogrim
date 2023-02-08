import { Box, Switch, Tooltip, Typography } from "@mui/material";
import useUpdateUserState from "../../../hooks/apiHooks/useUpdateUserState";
import { useAuth } from "../../../hooks/useAuth";
import { useStore } from "../../../hooks/useStore";

export const ComputeInProgressToggle: React.FC<{
  computeInProgress: boolean;
  setComputeInProgress: any;
}> = ({ computeInProgress, setComputeInProgress }) => {
  const {
    dataStore: { updateComputeInProgressInUserDetails },
  } = useStore();

  const { userAuthToken } = useAuth();
  const { mutate } = useUpdateUserState(userAuthToken);

  const handleChange = (
    _: React.SyntheticEvent,
    computeInProgress: boolean
  ) => {
    setComputeInProgress(computeInProgress);
    let newUserDetails =
      updateComputeInProgressInUserDetails(computeInProgress);
    mutate(newUserDetails);
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
