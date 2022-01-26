import { Box, Button, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useStore } from "../../../../hooks/useStore";
import { CourseBank } from "../../../../types/data-types";
import { RuleAll } from "./Step2Components/RuleAll";

const StepperP2Comp: React.FC = () => {
  const {
    dataStore: { currentCatalog, updateCatalogName, updateCatalogTotalCredit },
  } = useStore();

  const [courseBanks, setCourseBanks] = useState<CourseBank[]>([]);
  const [currentBank, setCurrentBank] = useState<string>("");

  useEffect(() => {
    if (
      currentCatalog &&
      currentCatalog.course_banks &&
      currentCatalog.course_banks.length > 0
    ) {
      setCourseBanks(currentCatalog.course_banks);
      setCurrentBank(currentCatalog.course_banks[0].name);
    }
  }, [currentCatalog]);

  const renderCourseBankFlowByRule = () => {
    const bank = courseBanks.find((bank) => bank.name === currentBank);
    if (!bank) {
      return;
    }
    switch (bank.rule) {
      case "All":
        return <RuleAll bankName={bank.name} />;
      case "Malag":
        return <div> malag </div>;
      case "Sport":
        return <div> sport </div>;
      case "AccumulateCredit":
        return <div> acc credit </div>;
      case "Elective":
        return <div> elective </div>;
    }
    //@ts-ignore
    if (bank.rule.hasOwnProperty("AccumulateCourses")) {
      return <div> acc courses </div>;
    }
    //@ts-ignore
    if (bank.rule.hasOwnProperty("Chains")) {
      return <div> chains </div>;
    }
  };

  const handleSelectBank = (bankName: string) => {
    const bankIdx = courseBanks.findIndex((bank) => bank.name === bankName);
    if (bankIdx < 0) {
      return;
    }
    setCurrentBank(courseBanks[bankIdx].name);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        m: 2,
      }}
    >
      <Typography variant="h4"> דרישות </Typography>
      {courseBanks.length === 0 ? (
        <Typography> אין עוד בנק דרישות בקטלוג</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, m: 1 }}>
          <Button
            variant="outlined"
            color="info"
            sx={{ alignSelf: "flex-end" }}
          >
            הוסף בנק חדש
          </Button>
          <Box
            sx={{ display: "flex", flexWrap: "wrap", gap: 1, maxWidth: 600 }}
          >
            {courseBanks.map((bank) => (
              <Button
                key={bank.name}
                variant="outlined"
                onClick={() => handleSelectBank(bank.name)}
              >
                {bank.name}
              </Button>
            ))}
          </Box>
          {renderCourseBankFlowByRule()}
        </Box>
      )}
    </Box>
  );
};
export const StepperP2 = observer(StepperP2Comp);
