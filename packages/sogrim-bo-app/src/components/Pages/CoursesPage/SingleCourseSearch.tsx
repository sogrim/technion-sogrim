import { Box } from "@mui/material";
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
  const [course, setCourse] = useState<Course | null>();
  const [searchType, setSearchType] = useState<SearchType>("course-name");

  //   const onChangeCourse = (e: React.ChangeEvent<HTMLInputElement>) => {
  //     e.preventDefault();
  //     const value = e.target.value as SearchOption;
  //     const course = getCourseById(value._id);
  //     setCourse(course);
  //   };

  const onChangeValue = (so: SearchOption) => {
    console.log(so);
  };
  return (
    <Box>
      <SeatchFiled
        searchLable={course?.name ?? "חפש קורס"}
        searchType={searchType}
        onChangeValue={onChangeValue}
      />
    </Box>
  );
};

export const SingleCourseSearch = observer(SingleCourseSearchComp);
