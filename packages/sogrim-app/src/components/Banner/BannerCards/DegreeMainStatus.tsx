import { Button, Card, CardContent, Typography } from "@mui/material";
import { DegreeStatusBar } from "./DegreeStatusBar";
import { useState, useEffect } from "react";
import { useStore } from "../../../hooks/useStore";
import { observer } from "mobx-react-lite";
import Confetti from "react-confetti";

const DegreeMainStatusComp: React.FC = () => {
  const {
    dataStore: { userDetails, isDegreeComplete },
  } = useStore();
  const [totalCredit, setTotalCredit] = useState<number>(0);
  const [pointsDone, setPointsDone] = useState<number>(0);
  const [catalogName, setCatalogName] = useState<string>("");
  const [confetti, setConfetti] = useState(false);
  const [confettiRecycle, setConfettiRecycle] = useState(false);

  const [showMainStatus, setShowMainStatus] = useState<boolean>(false);

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
      if (isDegreeComplete()) {
        setConfetti(true);
        setConfettiRecycle(true);
        setTimeout(() => {
          setConfettiRecycle(false);
        }, 3000);
      }
    }
  }, [
    isDegreeComplete,
    pointsDone,
    userDetails,
    userDetails?.degree_status?.course_statuses,
  ]);

  const progress =
    pointsDone / totalCredit >= 1 ? 100 : (pointsDone / totalCredit) * 100;

  return showMainStatus ? (
    <Card sx={{ minWidth: 275, maxHeight: 150 }}>
      <CardContent>
        <Typography sx={{ fontSize: 18 }} color="text.secondary" gutterBottom>
          סטאטוס תואר
        </Typography>
        <DegreeStatusBar progress={progress} />
        <Typography sx={{ fontSize: 22 }} color="text.primary">
          {`השלמת ${pointsDone} מתוך ${totalCredit} נקודות`}
        </Typography>
        <Button sx={{ display: "flex", justifyContent: "center" }} size="small">
          {catalogName}
        </Button>
        {confetti && (
          <Confetti
            width={window.innerWidth - 100}
            height={window.outerHeight}
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
