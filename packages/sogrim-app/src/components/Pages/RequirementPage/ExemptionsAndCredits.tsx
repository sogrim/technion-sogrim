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

  const customExemptions = semester0Courses.filter(
    (course) => course.courseNumber?.startsWith("EXEMPTION-") && !!course.type
  );
  const totalCustomExemptionsCredit = customExemptions.reduce(
    (sum, course) => sum + Number(course.credit || 0),
    0
  );
  const customDistribution = customExemptions.reduce<Record<string, number>>(
    (acc, course) => {
      const category = course.type || "ללא קטגוריה";
      acc[category] = (acc[category] || 0) + Number(course.credit || 0);
      return acc;
    },
    {}
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

  return customExemptions.length > 0 ? (
    <MessagesAccordion
      name="פטורים וזיכויים"
      tooltipMsg="פטור מאנגלית? נקודות על פעילות חברתית? כל הזיכויים והפטורים שעשיתם (וגם שלא ידעתם שעשיתם) יופיעו כאן"
      Messages={() => (
        <>
          {customExemptions.length > 0 && (
            <Box sx={{ padding: 0.5 }}>
              <Typography fontWeight={700}>
                סך נק״ז פטורים מותאמים אישית: {totalCustomExemptionsCredit}
              </Typography>
              {Object.entries(customDistribution).map(([category, credit]) => (
                <Typography key={category}>
                  {category}: {credit} נק״ז
                </Typography>
              ))}
              <Divider sx={{ mt: 0.5 }} />
            </Box>
          )}
          {customExemptions.map((course, id) => (
            <Box key={id} sx={{ padding: 0.5 }}>
              <Typography>
                {course.name} ({course.type}) - {course.credit} נק״ז
              </Typography>
              <Divider />
            </Box>
          ))}
        </>
      )}
    />
  ) : null;
};

export const ExemptionsAndCredits = observer(ExemptionsAndCreditsComp);
