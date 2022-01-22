import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useStore } from "../../../../hooks/useStore";
import { Course } from "../../../../types/data-types";

interface CoursePageUpdateProps {}

const CoursePageUpdateComp: React.FC<CoursePageUpdateProps> = () => {
  const {
    dataStore: {},
    uiStore: { currentSelectedCourse },
  } = useStore();

  const [updatedCourse, setUpdatedCourse] = useState<Course | undefined>(
    currentSelectedCourse
  );

  useEffect(() => {
    setUpdatedCourse(currentSelectedCourse);
  }, [currentSelectedCourse]);

  const handleEditChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let fieldName, fieldValue;
    event.preventDefault();
    fieldName = event.target?.getAttribute("name") as keyof Course;
    fieldValue = event.target.value;
    if (updatedCourse) {
      let newUpdatedCourse: Course = { ...updatedCourse };
      // @ts-ignore
      newUpdatedCourse[fieldName] = fieldValue;
      setUpdatedCourse(newUpdatedCourse);
    }
  };

  const handleUpdateClick = () => {
    /*
    TODO:
    1. validation. uniq id!
    update or add?
    2. insert to store.
    3. mutate to db.
    */
    if (updatedCourse) {
      console.log(updatedCourse.name);
    }
  };
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        name="name"
        sx={{ minWidth: 400 }}
        required
        id="outlined-name"
        label="שם הקורס"
        value={updatedCourse?.name}
        onChange={handleEditChange}
      />
      <TextField
        required
        name="_id"
        id="outlined-id"
        label="מספר הקורס"
        value={updatedCourse?._id}
        onChange={handleEditChange}
      />
      <TextField
        required
        name="credit"
        id="outlined-credit"
        label="נק״ז"
        value={updatedCourse?.credit}
      />
      <Button
        size="large"
        onClick={handleUpdateClick}
        variant="contained"
        color="info"
      >
        {" "}
        עדכן{" "}
      </Button>
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            מידע על עדכן - חדש וכו׳
          </Typography>
        </CardContent>{" "}
      </Card>
    </Box>
  );
};

export const CoursePageUpdate = observer(CoursePageUpdateComp);
