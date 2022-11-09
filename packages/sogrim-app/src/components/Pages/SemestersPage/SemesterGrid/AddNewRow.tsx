import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AutoFixNormalOutlinedIcon from "@mui/icons-material/AutoFixNormalOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import {
  Autocomplete,
  AutocompleteInputChangeReason,
  Box,
  Divider,
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
import { MAX_GRID_WIDTH } from "./semester-grid-interface";

export interface NewRowProps {
  handleAddClicked: (newRowInput: RowData) => void;
  setAddRowToggle: React.Dispatch<React.SetStateAction<boolean>>;
}

const NewRowComp: React.FC<NewRowProps> = ({
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

  const { userAuthToken } = useAuth();

  const {
    status: statusByName,
    data: dataByName,
    refetch: refetchByName,
    isError: isErrorByName,
    error: errorByName,
  } = useCoursesByFilter(userAuthToken, !!name, "name", name);

  const {
    status: statusByNumber,
    data: dataByNumber,
    refetch: refetchByNumber,
    isError: isErrorByNumber,
    error: errorByNumber,
  } = useCoursesByFilter(userAuthToken, !!courseNumber, "number", courseNumber);

  const refetchCoursesByName = React.useMemo(
    () => throttle(() => refetchByName(), 350),
    [refetchByName]
  );

  const refetchCoursesByNumber = React.useMemo(
    () => throttle(() => refetchByNumber(), 350),
    [refetchByNumber]
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
        refetchCoursesByName();
      }
      if (type === "courseNumber") {
        refetchCoursesByNumber();
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
    if (isErrorByName) {
      if ((errorByName as any).response.status === 401) {
        window.location.reload();
      }
    }
    if (isErrorByNumber) {
      if ((errorByNumber as any).response.status === 401) {
        window.location.reload();
      }
    }
    if (statusByName === "success" && dataByName) {
      setCourseNameOptions(dataByName);
    }
    if (statusByNumber === "success" && dataByNumber) {
      setCourseNumberOptions(dataByNumber);
    }
  }, [
    dataByName,
    dataByNumber,
    errorByName,
    errorByNumber,
    isErrorByName,
    isErrorByNumber,
    statusByName,
    statusByNumber,
  ]);

  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        height: 40,
        width: MAX_GRID_WIDTH,
      }}
    >
      <Autocomplete
        sx={{ width: "250px" }}
        freeSolo
        disableClearable
        autoComplete
        includeInputInList
        options={courseNameOptions.map(
          (option) => `${option._id} - ${option.name}`
        )}
        filterOptions={(options, state) =>
          options.filter((option: string) =>
            option.split("-")[1].includes(state.inputValue)
          )
        }
        value={name}
        inputValue={name}
        onChange={(_, value, type) =>
          value ? handleValueSelected(value, type) : null
        }
        onInputChange={(e, _, reason) => handleEditChange(e, "name", reason)}
        renderInput={(params) => (
          <TextField
            {...params}
            name="name"
            variant="outlined"
            size="small"
            helperText="שם הקורס"
          />
        )}
      />
      <Divider orientation="vertical" variant="middle" flexItem />

      <Autocomplete
        sx={{ width: "250px" }}
        freeSolo
        disableClearable
        autoComplete
        includeInputInList
        options={courseNumberOptions.map(
          (option) => `${option._id} - ${option.name}`
        )}
        filterOptions={(options, state) =>
          options.filter((option: string) =>
            option.split("-")[0].includes(state.inputValue)
          )
        }
        value={courseNumber}
        onChange={(_, value, type) =>
          value ? handleValueSelected(value, type) : null
        }
        onInputChange={(e, _, reason) =>
          handleEditChange(e, "courseNumber", reason)
        }
        renderInput={(params) => (
          <TextField
            {...params}
            name="courseNumber"
            variant="outlined"
            size="small"
            helperText="מס׳ הקורס"
          />
        )}
      />
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
        <Tooltip title={gradeToggle ? "ציון לא מספרי" : "ציון מספרי"} arrow>
          <IconButton size="small" color="primary" onClick={gradeToggleClick}>
            <AutoFixNormalOutlinedIcon />
          </IconButton>
        </Tooltip>
        {gradeToggle ? (
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
            {courseGradeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        )}
      </>
      <Divider orientation="vertical" variant="middle" flexItem />

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
      <Divider orientation="vertical" variant="middle" flexItem />

      <TextField
        disabled
        id="course-grade"
        name="state"
        variant="outlined"
        size="small"
        type="number"
        helperText="סטטוס"
      />
      <Divider orientation="vertical" variant="middle" flexItem />

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
