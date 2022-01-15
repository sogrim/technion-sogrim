import React from "react";
import { observer } from "mobx-react-lite";
import useUserState from "../../../../hooks/apiHooks/useUserState";
import { CourseBankReq } from "../../../../types/data-types";

import { Grid, Box } from "@mui/material";
import { BankRequirmentRow } from "./BankRequirmentsRow";

interface BankRequirmentsTableProps {}

const BankRequirmentsTableComp: React.FC<BankRequirmentsTableProps> = () => {
  const { data: userState } = useUserState();

  const banReqList: CourseBankReq[] =
    userState?.details?.degree_status?.course_bank_requirements ||
    ([] as CourseBankReq[]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      {banReqList?.map((banReq, id) => (
        <BankRequirmentRow key={id} bankRequirment={banReq} />
      ))}
    </Box>
  );
};

const sxPages = {
  width: "70%",
  display: "flex",
  justifyContent: "center",
};

export const BankRequirmentsTable = observer(BankRequirmentsTableComp);
