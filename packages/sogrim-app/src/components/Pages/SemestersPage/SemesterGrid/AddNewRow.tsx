import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AutoFixNormalOutlinedIcon from "@mui/icons-material/AutoFixNormalOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import {
  AutocompleteInputChangeReason,
  Box,
  Divider,
  FormHelperText,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from "@mui/material";
import throttle from "lodash/throttle";
import React, { useMemo, useState } from "react";
import useCoursesByFilter from "../../../../hooks/apiHooks/useCoursesByFilter";
import { useAuth } from "../../../../hooks/useAuth";
import { useStore } from "../../../../hooks/useStore";
import { Course } from "../../../../types/data-types";
import {
  courseGradeOptions,
  newEmptyRow,
  RowData,
} from "../SemesterTabsConsts";
import { CourseAutocomplete } from "./CourseAutocomplete";
import { MAX_GRID_WIDTH } from "./semester-grid-interface";

export interface NewRowProps {
  handleAddClicked: (newRowInput: RowData) => void;
  setAddRowToggle: React.Dispatch<React.SetStateAction<boolean>>;
  isSemester0: boolean;
}

const NewRowComp: React.FC<NewRowProps> = ({
  isSemester0,
  handleAddClicked,
  setAddRowToggle,
}) => {
  const {
    dataStore: { getUserBankNames },
  } = useStore();

  const banksNamesOptions = useMemo(
    () => getUserBankNames(),
    [getUserBankNames]
  );

  const [editRow, setEditRow] = useState<RowData>(newEmptyRow);

  const { name, courseNumber, credit, grade, type } = editRow;

  const [nameFilter, setNameFilter] = useState<string>("");
  const [numberFilter, setCourseNumberFilter] = useState<string>("");

  const { userAuthToken } = useAuth();

  const {
    status: statusByName,
    data: dataByName,
    isLoading: isLoadingByName,
  } = useCoursesByFilter(userAuthToken, !!name, "name", nameFilter);

  const {
    status: statusByNumber,
    data: dataByNumber,
    isLoading: isLoadingByNumber,
  } = useCoursesByFilter(userAuthToken, !!courseNumber, "number", numberFilter);

  const refetchCoursesByName = React.useMemo(
    () => throttle((name) => setNameFilter(name), 350),
    []
  );

  const refetchCoursesByNumber = React.useMemo(
    () => throttle((number) => setCourseNumberFilter(number), 350),
    []
  );

  const handleEditChange = (
    event: any,
    type?: string,
    reason?: AutocompleteInputChangeReason
  ) => {
    if (reason === "reset") {
      return;
    }
    let fieldName, fieldValue;
    if (type) {
      fieldName = type;
      fieldValue = event?.target?.value;
      if (type === "name") {
        refetchCoursesByName(fieldValue);
      }
      if (type === "courseNumber") {
        refetchCoursesByNumber(fieldValue);
      }
    } else {
      event.preventDefault();
      fieldName = type ?? (event.target?.getAttribute("name") as keyof RowData);
      fieldValue = event.target.value;
    }
    let newRowData: RowData = { ...editRow };
    // @ts-ignore
    newRowData[fieldName] = fieldValue;
    setEditRow(newRowData);
  };

  const handleValueSelected = (value: string, type?: string) => {
    let options = type === "name" ? courseNameOptions : courseNumberOptions;
    let selectedCourse = options.find((course) => {
      let courseNumber = value.split("-")[0].trim();
      return courseNumber === course._id;
    });
    if (selectedCourse) {
      let newRowData: RowData = { ...editRow };
      newRowData["courseNumber"] = selectedCourse._id;
      newRowData["name"] = selectedCourse.name;
      newRowData["credit"] = selectedCourse.credit;
      setEditRow(newRowData);
    }
  };

  const [gradeToggle, setGradeToggle] = useState<boolean>(true);
  const [nonNumericGrade, setNonNumericGrade] = useState<string>("");

  const gradeToggleClick = () => {
    setNonNumericGrade("");
    setGradeToggle(!gradeToggle);
  };

  const [courseNameOptions, setCourseNameOptions] = React.useState<
    readonly Course[]
  >([]);
  const [courseNumberOptions, setCourseNumberOptions] = React.useState<
    readonly Course[]
  >([]);

  React.useEffect(() => {
    if (statusByName === "success" && dataByName) {
      setCourseNameOptions(dataByName);
    }
    if (statusByNumber === "success" && dataByNumber) {
      setCourseNumberOptions(dataByNumber);
    }
  }, [dataByName, dataByNumber, statusByName, statusByNumber]);

  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        height: 40,
        width: MAX_GRID_WIDTH,
      }}
    >
      <CourseAutocomplete
        name="name"
        helperText="שם הקורס"
        options={courseNameOptions}
        option_map={(option) => `${option._id} - ${option.name}`}
        option_filter={(options, state) =>
          options.filter((option: string) =>
            option.split("-")[1].includes(state.inputValue)
          )
        }
        value={name}
        inputValue={name}
        onChange={handleValueSelected}
        onInputChange={handleEditChange}
        isLoading={isLoadingByName}
      />

      <Divider orientation="vertical" variant="middle" flexItem />

      {isSemester0 ? (
        <TextField
          id="course-number"
          name="courseNumber"
          onChange={handleEditChange}
          value={courseNumber}
          variant="outlined"
          size="small"
          helperText="מס׳ קורס (אופציונלי)"
        />
      ) : (
        <CourseAutocomplete
          name="courseNumber"
          helperText="מס׳ הקורס"
          options={courseNumberOptions}
          option_map={(option) => `${option._id} - ${option.name}`}
          option_filter={(options, state) =>
            options.filter((option: string) =>
              option.split("-")[0].includes(state.inputValue)
            )
          }
          value={courseNumber}
          inputValue={courseNumber}
          onChange={handleValueSelected}
          onInputChange={handleEditChange}
          isLoading={isLoadingByNumber}
        />
      )}

      <Divider orientation="vertical" variant="middle" flexItem />

      <TextField
        id="course-credit"
        name="credit"
        onChange={handleEditChange}
        value={credit}
        variant="outlined"
        size="small"
        type="tel"
        helperText="נק״ז"
      />
      <Divider orientation="vertical" variant="middle" flexItem />

      <>
        {!isSemester0 && (
          <Tooltip title={gradeToggle ? "ציון לא מספרי" : "ציון מספרי"} arrow>
            <IconButton size="small" color="primary" onClick={gradeToggleClick}>
              <AutoFixNormalOutlinedIcon />
            </IconButton>
          </Tooltip>
        )}
        {gradeToggle && !isSemester0 ? (
          <TextField
            id="course-grade"
            name="grade"
            type="tel"
            onChange={handleEditChange}
            label={grade}
            variant="outlined"
            size="small"
            helperText="ציון"
          />
        ) : (
          <Box sx={{ flexDirection: "column" }}>
            <Select
              id="course-grade"
              value={nonNumericGrade}
              name="grade"
              onChange={(event, newValue) => {
                setNonNumericGrade(event.target.value);
                handleEditChange(event, "grade");
              }}
              variant="outlined"
              size="small"
              sx={{ width: "170px" }}
            >
              {courseGradeOptions
                .filter((option) => !isSemester0 || option.includes("פטור"))
                .map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
            </Select>
            <FormHelperText sx={{ ml: 2 }}>ציון</FormHelperText>
          </Box>
        )}
      </>
      <Divider orientation="vertical" variant="middle" flexItem />

      <Box sx={{ flexDirection: "column" }}>
        <Select
          id="course-type"
          name="type"
          onChange={(event, newValue) => handleEditChange(event, "type")}
          value={type}
          variant="outlined"
          size="small"
          sx={{ width: "170px" }}
        >
          {banksNamesOptions?.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText sx={{ ml: 2 }}>קטגוריה</FormHelperText>
        <Divider orientation="vertical" variant="middle" flexItem />
      </Box>

      <IconButton
        sx={{ alignSelf: "flex-end" }}
        color="primary"
        aria-label="add-new-row"
        component="span"
        onClick={() => handleAddClicked(editRow)}
      >
        <AddOutlinedIcon />
      </IconButton>
      <Divider orientation="vertical" variant="middle" flexItem />

      <IconButton
        sx={{ alignSelf: "flex-end" }}
        color="primary"
        aria-label="cancel-new-row"
        component="span"
        onClick={() => setAddRowToggle(false)}
      >
        <CancelOutlinedIcon />
      </IconButton>
    </Box>
  );
};

export const AddNewRow = NewRowComp;
