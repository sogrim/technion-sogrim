import { Box, Button } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { useStore } from "../../../hooks/useStore";
import { CoursePageMode } from "../../../types/ui-types";
// import DynamicFeedIcon from "@mui/icons-material/DynamicFeed";
// import AddCircleIcon from "@mui/icons-material/AddCircle";
// import TocIcon from "@mui/icons-material/Toc";

interface CoursePageActionsProps {}

const CoursePageActionsComp: React.FC<CoursePageActionsProps> = () => {
  const {
    uiStore: { setCoursePageMode },
  } = useStore();
  return (
    <Box
      sx={{
        display: "flex",
        gap: 3,
      }}
    >
      <Button
        size="large"
        variant="contained"
        onClick={() => setCoursePageMode(CoursePageMode.Table)}
      >
        כל הקורסים
      </Button>
      <Button
        size="large"
        variant="contained"
        onClick={() => setCoursePageMode(CoursePageMode.Update)}
      >
        ערוך / הוסף קורס
      </Button>
      <Button
        size="large"
        variant="contained"
        onClick={() => setCoursePageMode(CoursePageMode.Delete)}
      >
        מחק קורס נוכחי
      </Button>
    </Box>
  );
};

export const CoursePageActions = observer(CoursePageActionsComp);
