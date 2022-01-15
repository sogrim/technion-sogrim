import React from "react";
import { observer } from "mobx-react-lite";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { CourseBankReq } from "../../../../types/data-types";

interface BankRequirmentRowProps {
  bankRequirment: CourseBankReq;
}

const BankRequirmentRowComp: React.FC<BankRequirmentRowProps> = ({
  bankRequirment,
}) => {
  const {
    course_bank_name,
    credit_completed,
    credit_requirement,
    course_completed,
    course_requirement,
    bank_rule_name,
  } = bankRequirment;

  return (
    <Accordion sx={{ minWidth: 700 }}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls="req-row-collaps"
        id="req-row-collaps"
      >
        <Typography fontWeight={"bold"}>{course_bank_name}</Typography>
      </AccordionSummary>
      <AccordionDetails></AccordionDetails>
    </Accordion>
  );
};

export const BankRequirmentRow = observer(BankRequirmentRowComp);
