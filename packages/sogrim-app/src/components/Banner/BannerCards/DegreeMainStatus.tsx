import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useStore } from "../../../hooks/useStore";
import { UserDetails } from "../../../types/data-types";
import { FormModal } from "../../Common/FormModal";
import { SelectCatalog } from "../BannerDialogs/SelectCatalog";
import { ComputeInProgressToggle } from "./ComputeInProgressToggle";
import { DegreeStatusBar } from "./DegreeStatusBar";

const getCreditOfCompleteCourses = (userDetails: UserDetails) =>
  userDetails?.degree_status?.course_statuses.reduce(
    (partialSum, courseStatus) => {
      let credit =
        courseStatus.state === "הושלם" ? courseStatus.course.credit : 0;
      return partialSum + credit;
    },
    0
  ) || 0;

const DegreeMainStatusComp: React.FC = () => {
  const {
    dataStore: { userDetails, userSettings },
  } = useStore();

  const [catalogName, setCatalogName] = useState<string>(
    userDetails?.catalog?.name || ""
  );
  const [pointsDone, setPointsDone] = useState<number>(
    userDetails?.degree_status?.total_credit || 0
  );
  const [totalCredit, setTotalCredit] = useState<number>(
    userDetails?.catalog?.total_credit || 0
  );
  const [onlyCompleteCredit, setOnlyCompleteCredit] = useState<number>(
    getCreditOfCompleteCourses(userDetails)
  );

  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [showMainStatus, setShowMainStatus] = useState<boolean>(true);
  const [computeInProgress, setComputeInProgress] = useState<boolean>(
    userSettings ? userSettings.compute_in_progress : false
  );

  // TODO: loading? or loading to all the banner!
  useEffect(() => {
    if (userDetails) {
      const studentTotal = userDetails?.degree_status?.total_credit || 0;
      const totalCredit = userDetails?.catalog?.total_credit || 0;
      const onlyCompleteCredit = getCreditOfCompleteCourses(userDetails);
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

  const coursesTotalProgress = isNaN(pointsDone / totalCredit)
    ? 0
    : Math.min((pointsDone / totalCredit) * 100, 100);

  const coursesCompleteProgress = isNaN(onlyCompleteCredit / totalCredit)
    ? 0
    : Math.min((onlyCompleteCredit / totalCredit) * 100, 100);

  return showMainStatus ? (
    <Card sx={{ minWidth: 275, maxHeight: 150 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 18 }} color="text.secondary" gutterBottom>
            סטטוס תואר
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
        <Button
          sx={{ display: "flex", justifyContent: "center" }}
          size="small"
          onClick={() => setCatalogModalOpen(true)}
        >
          {catalogName}
        </Button>
        <FormModal
          dialogContent={
            <SelectCatalog handleClose={() => setCatalogModalOpen(false)} />
          }
          handleClose={() => setCatalogModalOpen(false)}
          open={catalogModalOpen}
        />
      </CardContent>
    </Card>
  ) : null;
};

export const DegreeMainStatus = observer(DegreeMainStatusComp);
