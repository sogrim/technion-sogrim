import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { BankRequirmentsTable } from "./BankRequirmentsTable/BankRequirmentsTable";
import { CreditOverflow } from "./CreditOverflow";
import { ExemptionsAndCredits } from "./ExemptionsAndCredits";

interface RequirmentsTabProps {}

const RequirmentsPageComp: React.FC<RequirmentsTabProps> = () => {
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
      <BankRequirmentsTable />
      <Box sx={{ display: "flex", gap: 4, flexDirection: "column" }}>
        <CreditOverflow />
        <ExemptionsAndCredits />
      </Box>
    </Box>
  );
};

export const RequirmentsPage = observer(RequirmentsPageComp);
