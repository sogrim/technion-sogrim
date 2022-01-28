import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AutoFixNormalOutlinedIcon from "@mui/icons-material/AutoFixNormalOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import {
  Box,
  Divider,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useStore } from "../../../../hooks/useStore";
import {
  courseGradeOptions,
  newEmptyRow,
  RowData,
} from "../SemesterTabsConsts";

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

  const handleEditChange = (event: any, type?: string) => {
    let fieldName, fieldValue;
    if (type) {
      fieldName = type;
      fieldValue = event.target.value;
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

  const [gradeToggle, setGradeToggle] = useState<boolean>(true);
  const [nonNumericGrade, setNonNumericGrade] = useState<string>("");

  const gradeToggleClick = () => {
    setNonNumericGrade("");
    setGradeToggle(!gradeToggle);
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        height: 40,
        width: 1100,
        // justifyContent: "space-between",
      }}
    >
      <TextField
        id="course-name"
        name="name"
        onChange={handleEditChange}
        value={name}
        variant="outlined"
        size="small"
        helperText="שם הקורס"
        sx={{ width: "250px" }}
      />
      <Divider orientation="vertical" variant="middle" flexItem />

      <TextField
        id="course-number"
        name="courseNumber"
        onChange={handleEditChange}
        value={courseNumber}
        variant="outlined"
        size="small"
        helperText="מס׳ הקורס"
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
        {banksNamesOptions.map((option) => (
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
        helperText="סטאטוס"
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
