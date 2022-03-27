import {
  Button,
  Card,
  CardContent,
  Typography,
  Switch,
  Tooltip,
  Box,
} from "@mui/material";
import { DegreeStatusBar } from "./DegreeStatusBar";
import { useState, useEffect } from "react";
import { useStore } from "../../../hooks/useStore";
import { observer } from "mobx-react-lite";
import useUpdateUserSettings from "../../../hooks/apiHooks/useUpdateUserSettings";
import { useAuth } from "../../../hooks/useAuth";

const DegreeMainStatusComp: React.FC = () => {
  const {
    dataStore: {
      userDetails,
      userSettings,
      updateComputeInProgressInUserSettings,
    },
  } = useStore();

  const { userAuthToken } = useAuth();
  const { mutate, isError, error } = useUpdateUserSettings(userAuthToken);

  const [totalCredit, setTotalCredit] = useState<number>(0);
  const [pointsDone, setPointsDone] = useState<number>(0);
  const [catalogName, setCatalogName] = useState<string>("");

  const [showMainStatus, setShowMainStatus] = useState<boolean>(false);
  const [computeInProgress, setComputeInProgress] = useState<boolean>(
    userSettings ? userSettings.compute_in_progress : false
  );

  // TODO: loading? or loading to all the banner!
  useEffect(() => {
    if (userDetails) {
      const studentTotal = userDetails?.degree_status?.total_credit || 0;
      const totalCredit = userDetails?.catalog?.total_credit || 0;
      const catalogName = userDetails?.catalog?.name || "";
      setPointsDone(studentTotal);
      setTotalCredit(totalCredit);
      setCatalogName(catalogName);
      setShowMainStatus(catalogName !== "");
    }
    if (isError) {
      if ((error as any).response.status === 401) {
        window.location.reload();
      }
    }
    if (userSettings) {
      setComputeInProgress(userSettings.compute_in_progress);
    }
  }, [
    pointsDone,
    userDetails,
    userDetails?.degree_status?.course_statuses,
    userSettings,
    userSettings?.compute_in_progress,
    isError,
    error,
  ]);

  const progress =
    pointsDone / totalCredit >= 1 ? 100 : (pointsDone / totalCredit) * 100;

  const handleChange = (
    _: React.SyntheticEvent,
    computeInProgress: boolean
  ) => {
    let newUserSettings =
      updateComputeInProgressInUserSettings(computeInProgress);
    mutate(newUserSettings);
  };

  return showMainStatus ? (
    <Card sx={{ minWidth: 275, maxHeight: 150 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 18 }} color="text.secondary" gutterBottom>
            סטאטוס תואר
          </Typography>
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
        </Box>
        {/* TODO: work on design */}
        <DegreeStatusBar progress={progress} />
        <Typography sx={{ fontSize: 22 }} color="text.primary">
          {`השלמת ${pointsDone} מתוך ${totalCredit} נקודות`}
        </Typography>
        <Button sx={{ display: "flex", justifyContent: "center" }} size="small">
          {catalogName}
        </Button>
      </CardContent>
    </Card>
  ) : null;
};

export const DegreeMainStatus = observer(DegreeMainStatusComp);
