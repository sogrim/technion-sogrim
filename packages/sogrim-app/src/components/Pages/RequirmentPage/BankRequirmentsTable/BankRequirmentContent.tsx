import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { RowData } from "../../SemestersPage/SemesterTable/SemesterTabsConsts";

import { BankRequirmentCourseRow } from "./BankRequirmentCourseRow";

interface BankRequirmentContentProps {
  bankCourses: RowData[];
}

const BankRequirmentContentComp: React.FC<BankRequirmentContentProps> = ({
  bankCourses,
}) => {
  return (
    <div style={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {bankCourses.map((course) => (
          <BankRequirmentCourseRow course={course} />
        ))}
      </Box>
    </div>
  );
};

export const BankRequirmentContent = observer(BankRequirmentContentComp);
