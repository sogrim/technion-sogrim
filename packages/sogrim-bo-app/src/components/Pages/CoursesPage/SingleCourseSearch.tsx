import {
  Box,
  Card,
  Typography,
  CardContent,
  CardActions,
  Button,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { useStore } from "../../../hooks/useStore";
import { Course } from "../../../types/data-types";
import { SearchOption, SearchType } from "../../../types/ui-types";
import { SeatchFiled } from "../../Search/SearchField";

interface SingleCourseSearchProps {}

const SingleCourseSearchComp: React.FC<SingleCourseSearchProps> = () => {
  const {
    dataStore: { getCourseById },
  } = useStore();
  const [course, setCourse] = useState<Course | undefined>();
  const [searchType, setSearchType] = useState<SearchType>("course-name");

  const onChangeValue = (so: SearchOption) => {
    const course = getCourseById(so._id);
    if (course) {
      setCourse(course);
    }
  };

  const handleChangeSearchType = () => {
    const newSearchType =
      searchType === "course-name" ? "course-number" : "course-name";
    setSearchType(newSearchType);
  };

  const searchTypeButtonTitle =
    searchType === "course-name" ? "חפש לפי מס׳ קורס" : "חפש לפי שם ";
  return (
    <Box sx={{ display: "flex", gap: 5, alignItems: "center" }}>
      <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 20 }}>חפש קורס</Typography>
          <Button
            variant="outlined"
            onClick={handleChangeSearchType}
            size="small"
          >
            {searchTypeButtonTitle}
          </Button>
        </Box>

        <SeatchFiled
          searchLable={course?.name ?? "חפש קורס"}
          searchType={searchType}
          onChangeValue={onChangeValue}
        />
      </Box>
      <Card sx={{ minWidth: 350, minHeight: 130 }}>
        {course ? (
          <>
            <CardContent>
              <Typography sx={{ fontSize: 20 }}>{course.name}</Typography>
              <Typography sx={{ fontSize: 20 }}>{course._id}</Typography>
              <Typography sx={{ fontSize: 16 }}>
                {course.credit} {" נק״ז"}
              </Typography>
            </CardContent>
          </>
        ) : (
          <CardContent>
            <Typography sx={{ fontSize: 20 }}>לא נבחר קורס</Typography>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export const SingleCourseSearch = observer(SingleCourseSearchComp);
