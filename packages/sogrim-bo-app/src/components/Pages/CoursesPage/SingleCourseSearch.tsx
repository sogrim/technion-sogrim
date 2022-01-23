import { Box, Card, CardContent, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { useStore } from "../../../hooks/useStore";
import { SearchOption } from "../../../types/ui-types";
import { SearchFiled } from "../../Search/SearchField";

interface SingleCourseSearchProps {}

const SingleCourseSearchComp: React.FC<SingleCourseSearchProps> = () => {
  const {
    dataStore: { getCourseById },
    uiStore: { currentSelectedCourse, setCurrentSelectedCourse },
  } = useStore();

  const onChangeValue = (so: SearchOption) => {
    const course = getCourseById(so._id);
    if (course) {
      setCurrentSelectedCourse(course);
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 5, alignItems: "center" }}>
      <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 20 }}>חפש קורס</Typography>
        </Box>

        <SearchFiled
          searchLable={currentSelectedCourse?.name ?? "חפש קורס"}
          searchType={"course-name"}
          onChangeValue={onChangeValue}
        />
      </Box>
      <Card sx={{ minWidth: 350, minHeight: 130 }}>
        {currentSelectedCourse._id !== "" ? (
          <>
            <CardContent>
              <Typography sx={{ fontSize: 20 }}>
                {currentSelectedCourse.name}
              </Typography>
              <Typography sx={{ fontSize: 20 }}>
                {currentSelectedCourse._id}
              </Typography>
              <Typography sx={{ fontSize: 16 }}>
                {currentSelectedCourse.credit} {" נק״ז"}
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
