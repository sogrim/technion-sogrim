import React from "react";
import { observer } from "mobx-react-lite";
import { CourseBankReq } from "../../../../types/data-types";
import { Box } from "@mui/material";
import { BankRequirmentRow } from "./BankRequirmentsRow";
import { useStore } from "../../../../hooks/useStore";

interface BankRequirmentsTableProps {}

const BankRequirmentsTableComp: React.FC<BankRequirmentsTableProps> = () => {
  const {
    dataStore: { userDetails },
  } = useStore();

  const banReqList: CourseBankReq[] =
    userDetails?.degree_status?.course_bank_requirements ||
    ([] as CourseBankReq[]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      {banReqList?.map((banReq, id) => (
        <BankRequirmentRow key={id} bankRequirment={banReq} />
      ))}
    </Box>
  );
};

export const BankRequirmentsTable = observer(BankRequirmentsTableComp);
