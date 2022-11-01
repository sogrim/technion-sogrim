import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { CourseBankReq } from "../../../../types/data-types";
import { Box } from "@mui/material";
import { BankRequirementRow } from "./BankRequirementsRow";
import { useStore } from "../../../../hooks/useStore";

interface BankRequirementsTableProps {}

const BankRequirementsTableComp: React.FC<BankRequirementsTableProps> = () => {
  const {
    dataStore: { userDetails },
  } = useStore();

  const [bankReq, setBankReq] = useState<CourseBankReq[]>();

  useEffect(() => {
    const banReqList: CourseBankReq[] =
      userDetails?.degree_status?.course_bank_requirements ||
      ([] as CourseBankReq[]);
    const bankReqTemp = banReqList.slice().sort((first, second) => {
      return first.credit_requirement <= second.credit_requirement ? 1 : -1;
    });
    setBankReq(bankReqTemp);
  }, [userDetails]);

  return (
    <Box sx={{ flexGrow: 1, marginBottom: 15 }}>
      {bankReq?.map((banReq, id) => (
        <BankRequirementRow key={id} bankRequirement={banReq} />
      ))}
    </Box>
  );
};

export const BankRequirementsTable = observer(BankRequirementsTableComp);
