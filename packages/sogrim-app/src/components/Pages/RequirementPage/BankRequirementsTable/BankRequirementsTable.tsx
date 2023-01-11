import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { CourseBankReq, UserDetails } from "../../../../types/data-types";
import { Box } from "@mui/material";
import { BankRequirementRow } from "./BankRequirementsRow";
import { useStore } from "../../../../hooks/useStore";

interface BankRequirementsTableProps {}

const getBankRequirements = (userDetails: UserDetails): CourseBankReq[] => {
  const banReqList: CourseBankReq[] =
    userDetails?.degree_status?.course_bank_requirements ||
    ([] as CourseBankReq[]);
  return banReqList
    .slice()
    .sort((first, second) =>
      first.credit_requirement <= second.credit_requirement ? 1 : -1
    );
};

const BankRequirementsTableComp: React.FC<BankRequirementsTableProps> = () => {
  const {
    dataStore: { userDetails },
  } = useStore();

  const [bankReq, setBankReq] = useState<CourseBankReq[]>(
    getBankRequirements(userDetails)
  );

  useEffect(() => {
    setBankReq(getBankRequirements(userDetails));
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
