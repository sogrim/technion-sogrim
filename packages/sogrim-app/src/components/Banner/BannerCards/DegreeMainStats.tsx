import { useState, useEffect } from "react";
import { useStore } from "../../../hooks/useStore";
import { observer } from "mobx-react-lite";
import { Typography, Card, CardContent } from "@mui/material";

const DegreeMainStatsComp: React.FC = () => {
  const {
    dataStore: { userDetails, getUserGPA, getNumberOfBankComplete },
  } = useStore();
  const [gpa, setGpa] = useState<number | null>(null);
  const [banksDone, setBanksDone] = useState<number | null>(0);

  useEffect(() => {
    if (
      userDetails &&
      userDetails?.degree_status?.course_statuses?.length > 0
    ) {
      setGpa(getUserGPA());
      setBanksDone(getNumberOfBankComplete());
    }
  }, [
    getNumberOfBankComplete,
    getUserGPA,
    userDetails,
    userDetails?.degree_status?.course_statuses,
  ]);

  const totalBanks =
    userDetails?.degree_status?.course_bank_requirements?.length;

  return gpa && gpa > 0 ? (
    <Card sx={{ minWidth: 275, maxHeight: 150 }}>
      <CardContent>
        <Typography sx={{ fontSize: 18 }} color="text.secondary" gutterBottom>
          סטטיטיקות תואר
        </Typography>
        <Typography sx={{ fontSize: 18 }} color="text.primary">
          {`ממוצע כללי: ${gpa} `}
        </Typography>
        <Typography sx={{ fontSize: 18 }} color="text.primary">
          {`השלמת ${banksDone} מתוך ${totalBanks} דרישות בתואר`}
        </Typography>
      </CardContent>
    </Card>
  ) : null;
};

export const DegreeMainStats = observer(DegreeMainStatsComp);
