import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
  Tooltip,
  Chip,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import {
  ACCUMULATE_COURSES,
  CourseBankReq,
  SPECIALIZATION_GROUPS,
} from "../../../../types/data-types";
import { LinearProgressBar } from "./LinearProgressBar";
import { BankChip } from "./BankChip";
import { useStore } from "../../../../hooks/useStore";
import { BankRequirementContent } from "./BankRequirementContent";
interface BankRequirementRowProps {
  bankRequirement: CourseBankReq;
}

const BankRequirementRowComp: React.FC<BankRequirementRowProps> = ({
  bankRequirement,
}) => {
  const {
    dataStore: { userDetails, generateRowsForBank },
  } = useStore();

  const bankCourses = useMemo(
    () =>
      generateRowsForBank(
        bankRequirement?.course_bank_name,
        userDetails?.degree_status?.course_statuses
      ),
    [
      bankRequirement?.course_bank_name,
      generateRowsForBank,
      userDetails?.degree_status?.course_statuses,
    ]
  );
  const {
    course_bank_name,
    credit_completed,
    credit_requirement,
    course_completed,
    course_requirement,
    bank_rule_name,
    completed,
  } = bankRequirement;

  const progress =
    course_requirement === null && credit_requirement === null
      ? null
      : bank_rule_name === ACCUMULATE_COURSES ||
        (bank_rule_name === SPECIALIZATION_GROUPS &&
          credit_requirement === null)
      ? (course_completed / course_requirement) * 100
      : (credit_completed / credit_requirement) * 100;

  const subtitle =
    bank_rule_name === ACCUMULATE_COURSES
      ? `השלמת ${course_completed} מתוך ${course_requirement} קורסים`
      : bank_rule_name === SPECIALIZATION_GROUPS && credit_requirement === null
      ? `השלמת ${course_completed} מתוך ${course_requirement} קבוצות`
      : `השלמת ${credit_completed} מתוך ${credit_requirement} נק״ז`;

  return (
    <Accordion sx={{ minWidth: 700 }}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls="req-row-collapse"
        id="req-row-collapse"
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                display: "flex",
                alignContent: "baseline",
                alignItems: "baseline",
              }}
            >
              <Typography fontWeight={"bold"}>{course_bank_name}</Typography>
              <BankChip completed={!!completed} />
              {bankRequirement.message && (
                <Tooltip
                  title={
                    <Typography fontSize={"16px"}>
                      {bankRequirement.message}
                    </Typography>
                  }
                  arrow
                >
                  <Chip
                    sx={{ ml: "8px" }}
                    label="מידע נוסף"
                    variant="outlined"
                    size="small"
                  />
                </Tooltip>
              )}
            </Box>

            {progress !== null && <Typography>{subtitle}</Typography>}
          </Box>
          <Box sx={{ minWidth: 200 }}>
            {progress !== null && <LinearProgressBar value={progress} />}
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <BankRequirementContent bankCourses={bankCourses} />
      </AccordionDetails>
    </Accordion>
  );
};

export const BankRequirementRow = observer(BankRequirementRowComp);
