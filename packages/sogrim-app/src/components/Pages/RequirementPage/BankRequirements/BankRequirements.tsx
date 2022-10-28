import React from "react";
import { observer } from "mobx-react-lite";
import useUserState from "../../../../hooks/apiHooks/useUserState";
import { CourseBankReq } from "../../../../types/data-types";
import { RequirementItem } from "./RequirementItem";
import { Grid, Box } from "@mui/material";

interface BankRequirementsProps {}

const BankRequirementsComp: React.FC<BankRequirementsProps> = () => {
  const { data: userState } = useUserState();

  const banReqList: CourseBankReq[] =
    userState?.details?.degree_status?.course_bank_requirements ||
    ([] as CourseBankReq[]);

  return (
    <Box sx={{ marginTop: 2 }}>
      <Grid
        sx={sxPages}
        container
        spacing={{ xs: 2, md: 2 }}
        columns={{ xs: 3, md: 3 }}
      >
        {banReqList?.map((banReq, id) => (
          <RequirementItem key={id} bankRequirement={banReq} />
        ))}
      </Grid>
    </Box>
  );
};

const sxPages = {
  width: "70%",
  display: "flex",
  justifyContent: "center",
};

export const BankRequirements = observer(BankRequirementsComp);
