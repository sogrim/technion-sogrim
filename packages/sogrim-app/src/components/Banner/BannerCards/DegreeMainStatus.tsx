import {
  Button,
  Card,
  CardContent,
  Typography,
  Switch,
  Grid,
} from "@mui/material";
import { DegreeStatusBar } from "./DegreeStatusBar";
import { useState, useEffect, useCallback } from "react";
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
    if (
      userDetails &&
      userDetails?.degree_status?.course_statuses?.length > 0
    ) {
      const studentTotal = userDetails?.degree_status?.total_credit || 0;
      const totalCredit = userDetails?.catalog?.total_credit || 0;
      const catalogName = userDetails?.catalog?.name || "";
      setPointsDone(studentTotal);
      setTotalCredit(totalCredit);
      setCatalogName(catalogName);
      setShowMainStatus(totalCredit * pointsDone > 0 && catalogName !== "");
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
        <Typography
          sx={{ fontSize: 18 }}
          color="text.secondary"
          gutterBottom
          display="inline"
        >
          סטאטוס תואר
        </Typography>
        <Typography display="inline">
          <Switch onChange={handleChange} checked={computeInProgress} />
        </Typography>
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
