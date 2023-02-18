import { Box, Divider, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useStore } from "../../../hooks/useStore";
import { RowData } from "../SemestersPage/SemesterTabsConsts";
import { MessagesAccordion } from "./MessagesAccordion";

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

  return semester0Courses.length > 0 ? (
    <MessagesAccordion
      name="פטורים וזיכויים"
      tooltipMsg="פטור מאנגלית? נקודות על פעילות חברתית? כל הזיכויים והפטורים שעשיתם (וגם שלא ידעתם שעשיתם) יופיעו כאן"
      Messages={() => (
        <>
          {semester0Courses.map((course, id) => (
            <Box key={id} sx={{ padding: 0.5 }}>
              <Typography> {course.name} </Typography>
              <Divider />
            </Box>
          ))}
        </>
      )}
    />
  ) : (
    <></>
  );
};

export const ExemptionsAndCredits = observer(ExemptionsAndCreditsComp);
