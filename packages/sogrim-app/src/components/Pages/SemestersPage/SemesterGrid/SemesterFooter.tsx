import { Box, Typography, Divider } from "@mui/material";
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
  }, [rows]);

  const compute = () => {
    let sum = 0,
      credit = 0,
      t_credit = 0;
    rows.forEach((row) => {
      t_credit += +row.credit;
      const courserGrade = row.grade ? Number(row.grade) : null;
      if (courserGrade === 0 || !!courserGrade) {
        sum += courserGrade * +row.credit;
        credit += +row.credit;
      }
      if (row.grade === "עבר") {
        credit += +row.credit;
      }
    });
    setTotalCredit(t_credit);
    if (credit !== 0) {
      setAvg(Math.round((sum / credit + Number.EPSILON) * 10) / 10);
      setDoneCredit(credit);
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
