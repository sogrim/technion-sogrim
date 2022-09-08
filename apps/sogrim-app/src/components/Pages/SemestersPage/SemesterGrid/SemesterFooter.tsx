import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { RowData } from "../SemesterTabsConsts";

interface SemesterFooterProps {
  rows: RowData[];
}
export const SemesterFooter: React.FC<SemesterFooterProps> = ({ rows }) => {
  const [avg, setAvg] = useState<number | "-">("-");
  const [doneCredit, setDoneCredit] = useState<number | "-">("-");
  const [totalCredit, setTotalCredit] = useState<number | "-">("-");

  useEffect(() => {
    compute();
    // TODO check
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const compute = () => {
    let sum = 0,
      doneCredit = 0,
      doneCreditNoExemption = 0,
      totalCredit = 0;
    rows.forEach((row) => {
      totalCredit += +row.credit;
      const courserGrade = row.grade ? Number(row.grade) : null;
      if (courserGrade === 0 || !!courserGrade) {
        sum += courserGrade * +row.credit;
        doneCredit += +row.credit;
        doneCreditNoExemption += +row.credit;
      }
      if (row.grade === "עבר" || row.grade === "פטור עם ניקוד") {
        doneCredit += +row.credit;
      }
    });
    setTotalCredit(totalCredit);
    if (doneCreditNoExemption !== 0) {
      setAvg(
        Math.round((sum / doneCreditNoExemption + Number.EPSILON) * 10) / 10
      );
      setDoneCredit(doneCredit);
    }
  };

  return (
    <Box sx={{ display: "flex", p: 2, gap: 1, justifyContent: "center" }}>
      <Typography color={"text.secondary"}> ממוצע סמסטר: {avg}</Typography>
      {bull}
      <Typography color={"text.secondary"}>
        נק״ז ששובצו: {totalCredit}{" "}
      </Typography>
      {bull}
      <Typography color={"text.secondary"}>
        {" "}
        נק״ז שבוצעו: {doneCredit}
      </Typography>
    </Box>
  );
};

const bull = (
  <Box
    component="span"
    sx={{
      display: "inline-block",
      mx: "2px",
      transform: "scale(0.8)",
      fontSize: "16px",
    }}
  >
    •
  </Box>
);
