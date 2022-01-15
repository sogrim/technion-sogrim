import React from "react";
import { observer } from "mobx-react-lite";
import { Box } from "@mui/material";
import { CreditOverflow } from "./CreditOverflow";
import { BankRequirmentsTable } from "./BankRequirmentsTable/BankRequirmentsTable";

interface RequirmentsTabProps {}

const RequirmentsPageComp: React.FC<RequirmentsTabProps> = () => {
  return (
    <div style={{ width: "80%" }}>
      <Box
        sx={{
          display: "flex",
          p: 1,
          gap: 3,
        }}
      >
        <BankRequirmentsTable />

        <CreditOverflow />
      </Box>
    </div>
  );
};

export const RequirmentsPage = observer(RequirmentsPageComp);
