import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { SeatchFiled } from "../../Search/SearchField";
import { SingleCourseSearch } from "./SingleCourseSearch";

interface CoursePageProps {}

const CoursePageComp: React.FC<CoursePageProps> = () => {
  return (
    <div style={{ width: "80%" }}>
      <Box
        sx={{
          display: "flex",
          p: 1,
          gap: 3,
        }}
      >
        <SingleCourseSearch />
      </Box>
    </div>
  );
};

export const CoursePage = observer(CoursePageComp);
