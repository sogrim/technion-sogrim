import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { useStore } from "../../../hooks/useStore";
import { SearchOption, SearchType } from "../../../types/ui-types";
import { SeatchFiled } from "../../Search/SearchField";

interface SingleCourseSearchProps {}

const SingleCourseSearchComp: React.FC<SingleCourseSearchProps> = () => {
  const {
    dataStore: { getCourseById },
    uiStore: { currentSelectedCourseId, setCurrentSelectedCourse },
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

        <SeatchFiled
          searchLable={currentSelectedCourseId?.name ?? "חפש קורס"}
          searchType={"course-name"}
          onChangeValue={onChangeValue}
        />
      </Box>
      <Card sx={{ minWidth: 350, minHeight: 130 }}>
        {currentSelectedCourseId ? (
          <>
            <CardContent>
              <Typography sx={{ fontSize: 20 }}>
                {currentSelectedCourseId.name}
              </Typography>
              <Typography sx={{ fontSize: 20 }}>
                {currentSelectedCourseId._id}
              </Typography>
              <Typography sx={{ fontSize: 16 }}>
                {currentSelectedCourseId.credit} {" נק״ז"}
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
