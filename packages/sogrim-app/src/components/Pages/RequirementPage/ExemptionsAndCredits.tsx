import { ExpandMore } from "@mui/icons-material";
import InfoTwoToneIcon from "@mui/icons-material/InfoTwoTone";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useStore } from "../../../hooks/useStore";
import { RowData } from "../SemestersPage/SemesterTabsConsts";

interface ExemptionsAndCreditsProps {}

const ExemptionsAndCreditsComp: React.FC<ExemptionsAndCreditsProps> = () => {
  const {
    dataStore: { generateRowsForSemester, userDetails },
  } = useStore();

  const [semester0Courses, setSemester0Courses] = useState<RowData[]>(
    generateRowsForSemester(
      null,
      userDetails.degree_status.course_statuses,
      true
    )
  );

  useEffect(() => {
    if (userDetails) {
      setSemester0Courses(
        generateRowsForSemester(
          null,
          userDetails.degree_status.course_statuses,
          true
        )
      );
    }
  }, [userDetails, generateRowsForSemester]);

  return (
    <div>
      <Accordion
        defaultExpanded
        sx={{
          minWidth: 400,
          p: 1,
          borderRadius: 2,
          border: "2px solid #d1d1d1",
          boxShadow: 0,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="overflow-collapse"
          id="overflow-collapse"
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6" fontWeight={"bold"}>
              פטורים וזיכויים
            </Typography>
            <Tooltip
              title={
                <Typography>
                  פטור מאנגלית? נקודות על פעילות חברתית? כל הזיכויים והפטורים
                  שעשיתם (וגם שלא ידעתם שעשיתם) יופיעו כאן
                </Typography>
              }
              placement="bottom"
              arrow
            >
              <IconButton>
                <InfoTwoToneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {semester0Courses.map((course, id) => (
            <Box key={id} sx={{ padding: 0.5 }}>
              <Typography> {course.name} </Typography>
              <Divider />
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export const ExemptionsAndCredits = observer(ExemptionsAndCreditsComp);
