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
import Confetti from "react-confetti";

const DegreeMainStatusComp: React.FC = () => {
  const {
    dataStore: {
      userDetails,
      userSettings,
      updateComputeInProgressInUserSettings,
      isDegreeComplete,
    },
  } = useStore();

  const { userAuthToken } = useAuth();
  const { mutate, isError, error } = useUpdateUserSettings(userAuthToken);

  const [totalCredit, setTotalCredit] = useState<number>(0);
  const [onlyCompleteCredit, setOnlyCompleteCredit] = useState<number>(0);
  const [pointsDone, setPointsDone] = useState<number>(0);
  const [catalogName, setCatalogName] = useState<string>("");
  const [confetti, setConfetti] = useState(false);
  const [confettiRecycle, setConfettiRecycle] = useState(false);

  const [showMainStatus, setShowMainStatus] = useState<boolean>(false);
  const [computeInProgress, setComputeInProgress] = useState<boolean>(
    userSettings ? userSettings.compute_in_progress : false
  );

  // TODO: loading? or loading to all the banner!
  useEffect(() => {
    if (userDetails) {
      const studentTotal = userDetails?.degree_status?.total_credit || 0;
      const totalCredit = userDetails?.catalog?.total_credit || 0;
      const onlyCompleteCredit =
        userDetails?.degree_status?.course_statuses.reduce(
          (partialSum, courseStatus) => {
            let credit =
              courseStatus.state === "הושלם" ? courseStatus.course.credit : 0;
            return partialSum + credit;
          },
          0
        ) || 0;
      const catalogName = userDetails?.catalog?.name || "";

      setPointsDone(studentTotal);
      setTotalCredit(totalCredit);
      setOnlyCompleteCredit(onlyCompleteCredit);
      setCatalogName(catalogName);
      setShowMainStatus(catalogName !== "");
    }
    if (isError) {
      if ((error as any).response.status === 401) {
        window.location.reload();
      }
    }

    if (isDegreeComplete()) {
      setConfetti(true);
      setConfettiRecycle(true);
      setTimeout(() => {
        setConfettiRecycle(false);
      }, 3000);
    }
  }, [
    error,
    isDegreeComplete,
    isError,
    pointsDone,
    userDetails,
    userDetails?.degree_status.course_statuses,
    userSettings,
  ]);

  const coursesTotalProgress =
    pointsDone / totalCredit >= 1 ? 100 : (pointsDone / totalCredit) * 100;

  const coursesCompleteProgress =
    onlyCompleteCredit / totalCredit >= 1
      ? 100
      : (onlyCompleteCredit / totalCredit) * 100;

  const handleChange = (
    _: React.SyntheticEvent,
    computeInProgress: boolean
  ) => {
    setComputeInProgress(computeInProgress);
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
        <DegreeStatusBar
          {...{
            coursesCompleteProgress,
            coursesTotalProgress,
            computeInProgress,
          }}
        />
        <Typography sx={{ fontSize: 22 }} color="text.primary">
          {`השלמת ${pointsDone} מתוך ${totalCredit} נקודות`}
        </Typography>
        <Button sx={{ display: "flex", justifyContent: "center" }} size="small">
          {catalogName}
        </Button>
        {confetti && (
          <Confetti
            width={2000}
            numberOfPieces={500}
            recycle={confettiRecycle}
            onConfettiComplete={() => setConfetti(false)}
          />
        )}
      </CardContent>
    </Card>
  ) : null;
};

export const DegreeMainStatus = observer(DegreeMainStatusComp);
