import { Box, Button } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";

interface CoursePageActionsProps {}

const CoursePageActionsComp: React.FC<CoursePageActionsProps> = () => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 3,
      }}
    >
      <Button> 1</Button>
      <Button> 2</Button>
    </Box>
  );
};

export const CoursePageActions = observer(CoursePageActionsComp);
