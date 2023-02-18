import { useState, useEffect } from "react";
import { useStore } from "../../../hooks/useStore";
import { observer } from "mobx-react-lite";
import { Typography, Card, CardContent, Button } from "@mui/material";
import Confetti from "react-confetti";

const DegreeMainStatsComp: React.FC = () => {
  const {
    dataStore: { userDetails, getUserGPA, getNumberOfBankComplete },
  } = useStore();
  const [gpa, setGpa] = useState<number>(getUserGPA());
  const [banksDone, setBanksDone] = useState<number>(getNumberOfBankComplete());
  const [confetti, setConfetti] = useState(false);
  const [confettiRecycle, setConfettiRecycle] = useState(false);
  const totalBanks =
    userDetails?.degree_status?.course_bank_requirements?.length;

  useEffect(() => {
    if (
      userDetails &&
      userDetails?.degree_status?.course_statuses?.length > 0
    ) {
      setGpa(getUserGPA());
      setBanksDone(getNumberOfBankComplete());
      if (!userDetails.modified && getNumberOfBankComplete() >= totalBanks) {
        setConfetti(true);
        setConfettiRecycle(true);
        setTimeout(() => {
          setConfettiRecycle(false);
        }, 3000);
      }
    }
  }, [
    getNumberOfBankComplete,
    getUserGPA,
    userDetails,
    userDetails?.degree_status?.course_statuses,
    totalBanks,
  ]);

  return (
    <Card sx={{ minWidth: 275, maxHeight: 150 }}>
      <CardContent>
        <Typography sx={{ fontSize: 18 }} color="text.secondary" gutterBottom>
          סטטיסטיקות תואר
        </Typography>
        <Typography sx={{ fontSize: 18 }} color="text.primary">
          {`ממוצע כללי: ${gpa} `}
        </Typography>
        <Typography sx={{ fontSize: 18 }} color="text.primary">
          {`השלמת ${banksDone} מתוך ${
            totalBanks ? totalBanks : "..."
          } דרישות בתואר`}
        </Typography>
        {confetti && (
          <Confetti
            numberOfPieces={500}
            recycle={confettiRecycle}
            onConfettiComplete={() => setConfetti(false)}
          />
        )}
      </CardContent>
    </Card>
  );
};

export const DegreeMainStats = observer(DegreeMainStatsComp);
