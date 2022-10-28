import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { BankRequirementsTable } from "./BankRequirementsTable/BankRequirementsTable";
import { CreditOverflow } from "./CreditOverflow";
import { ExemptionsAndCredits } from "./ExemptionsAndCredits";

interface RequirementsTabProps {}

const RequirementsPageComp: React.FC<RequirementsTabProps> = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { lg: "row", md: "column" },
        maxWidth: "1200px",
        p: 1,
        gap: 3,
      }}
    >
      <BankRequirementsTable />
      <Box sx={{ display: "flex", gap: 4, flexDirection: "column" }}>
        <CreditOverflow />
        <ExemptionsAndCredits />
      </Box>
    </Box>
  );
};

export const RequirementsPage = observer(RequirementsPageComp);
