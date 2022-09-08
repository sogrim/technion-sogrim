import { Button, Card, CardContent, Typography, Box } from "@mui/material";
import { DegreeStatusBar } from "./DegreeStatusBar";
import { useState, useEffect } from "react";
import { useStore } from "../../../hooks/useStore";
import { observer } from "mobx-react-lite";
import { ComputeInProgressToggle } from "./ComputeInProgressToggle";

const DegreeMainStatusComp: React.FC = () => {
  const {
    dataStore: { userDetails, userSettings },
  } = useStore();

  const [totalCredit, setTotalCredit] = useState<number>(0);
  const [onlyCompleteCredit, setOnlyCompleteCredit] = useState<number>(0);
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
  }, [
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

  return showMainStatus ? (
    <Card sx={{ minWidth: 275, maxHeight: 150 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 18 }} color="text.secondary" gutterBottom>
            סטאטוס תואר
          </Typography>
          <ComputeInProgressToggle
            computeInProgress={computeInProgress}
            setComputeInProgress={setComputeInProgress}
          />
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
      </CardContent>
    </Card>
  ) : null;
};

export const DegreeMainStatus = observer(DegreeMainStatusComp);
