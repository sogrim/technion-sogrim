import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { RowData } from "../../SemestersPage/SemesterTabsConsts";

import { BankRequirementCourseRow } from "./BankRequirementCourseRow";

interface BankRequirementContentProps {
  bankCourses: RowData[];
}

const BankRequirementContentComp: React.FC<BankRequirementContentProps> = ({
  bankCourses,
}) => {
  // TODO export to util function
  const generateKey = (course: RowData, idx: number) =>
    course.courseNumber + course.semester + idx;

  return (
    <div style={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {bankCourses.map((course, idx) => (
          <BankRequirementCourseRow
            key={generateKey(course, idx)}
            course={course}
          />
        ))}
      </Box>
    </div>
  );
};

export const BankRequirementContent = observer(BankRequirementContentComp);
