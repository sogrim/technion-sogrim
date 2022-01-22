import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { CoursePageActions } from "./CoursePageActions";
import { CoursePageNav } from "./CoursePageNav.tsx/CoursePageNav";
import { SingleCourseSearch } from "./SingleCourseSearch";

interface CoursePageProps {}

const CoursePageComp: React.FC<CoursePageProps> = () => {
  return (
    <div style={{ width: "80%", display: "flex" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 1,
          gap: 3,
          justifyContent: "center",
          textAlign: "center",
          alignContent: "center",
          alignItems: "center",
        }}
      >
        <SingleCourseSearch />
        <CoursePageActions />
        <CoursePageNav />
      </Box>
    </div>
  );
};

export const CoursePage = observer(CoursePageComp);
