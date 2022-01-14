import { Button, Card, CardContent, Typography } from "@mui/material";
import { DegreeStatusBar } from "./DegreeStatusBar";
import useUserState from "../../../hooks/apiHooks/useUserState";
import { useState, useEffect } from "react";

export const DegreeMainStatus: React.FC = ({ children }) => {
  const { data, isLoading } = useUserState();
  const [totalCredit, setTotalCredit] = useState<number>(0);
  const [pointsDone, setPointsDone] = useState<number>(0);
  const [catalogName, setCatalogName] = useState<string>("");

  const showMainStatus = totalCredit * pointsDone > 0 && catalogName !== "";

  // TODO: loading? or loading to all the banner!
  useEffect(() => {
    if (data && !isLoading) {
      const studentTotal = data?.details?.degree_status?.total_credit || 0;
      const totalCredit = data?.details?.catalog?.total_credit || 0;
      const catalogName = data?.details?.catalog?.name || "";
      setPointsDone(studentTotal);
      setTotalCredit(totalCredit);
      setCatalogName(catalogName);
    }
  }, [data, isLoading]);

  const progress =
    pointsDone / totalCredit >= 1 ? 100 : (pointsDone / totalCredit) * 100;
  return showMainStatus ? (
    <Card sx={{ minWidth: 275 }}>
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
      </CardContent>
    </Card>
  ) : null;
};
