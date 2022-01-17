import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { BankRequirmentsTable } from "./BankRequirmentsTable/BankRequirmentsTable";
import { CreditOverflow } from "./CreditOverflow";

interface RequirmentsTabProps {}

const RequirmentsPageComp: React.FC<RequirmentsTabProps> = () => {
  return (
    <div style={{ width: "80%" }}>
      <Box
        sx={{
          display: "flex",
          p: 1,
          gap: 3,
          paddingBottom: "55px",
        }}
      >
        <BankRequirmentsTable />
        <CreditOverflow />
      </Box>
    </div>
  );
};

export const RequirmentsPage = observer(RequirmentsPageComp);
