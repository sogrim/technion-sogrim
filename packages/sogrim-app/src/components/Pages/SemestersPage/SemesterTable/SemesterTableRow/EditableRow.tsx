import { useState, useMemo } from "react";
import { useStore } from "../../../../../hooks/useStore";
import {
  Grid,
  IconButton,
  MenuItem,
  TableCell,
  TextField,
  Tooltip,
  Select,
} from "@mui/material";
import AutoFixNormalOutlinedIcon from "@mui/icons-material/AutoFixNormalOutlined";
import { RowData } from "../SemesterTabsConsts";
import { EditActionCell } from "./EditActionCell";
import { courseGradeOptions } from "../SemesterTabsConsts";

export interface EditableRowProps {
  editRow: RowData;
  handleEditChange: any;
  handleSave: any;
  handleCancel: any;
  labelId: string;
}

const EditableRowComp: React.FC<EditableRowProps> = ({
  editRow,
  handleEditChange,
  handleCancel,
  handleSave,
  labelId,
}) => {
  const { name, courseNumber, credit, grade, state, type } = editRow;

  const {
    dataStore: { getUserBankNames },
  } = useStore();

  const banksNamesOptions = useMemo(
    () => getUserBankNames(),
    [getUserBankNames]
  );

  const [gradeToggle, setGradeToggle] = useState<boolean>(true);
  const [nonNumericGrade, setNonNumericGrade] = useState<string>("");

  const gradeToggleClick = () => {
    setNonNumericGrade("");
    setGradeToggle(!gradeToggle);
  };

  return (
    <>
      <TableCell
        align="center"
        component="th"
        id={labelId}
        scope="row"
        padding="none"
        width={"250px"}
      >
        <TextField
          id="course-name"
          name="name"
          onChange={handleEditChange}
          label={name}
          variant="outlined"
          size="small"
        />
      </TableCell>
      <TableCell align="center" width={"150px"}>
        {courseNumber}
      </TableCell>
      <TableCell align="center" width={"80px"}>
        <TextField
          id="course-credit"
          name="credit"
          onChange={handleEditChange}
          label={credit}
          variant="outlined"
          size="small"
          type="tel"
        />
      </TableCell>
      <TableCell align="center" width={"250px"}>
        <Grid container justifyContent={"center"} direction={"row"}>
          <Tooltip title={gradeToggle ? "ציון לא מספרי" : "ציון מספרי"} arrow>
            <IconButton color="primary" onClick={gradeToggleClick}>
              <AutoFixNormalOutlinedIcon />
            </IconButton>
          </Tooltip>
          {gradeToggle ? (
            <TextField
              id="course-grade"
              name="grade"
              onChange={handleEditChange}
              label={grade}
              variant="outlined"
              size="small"
              type="number"
            />
          ) : (
            <Select
              id="course-grade"
              value={nonNumericGrade}
              name="grade"
              onChange={(event, newValue) => {
                setNonNumericGrade(event.target.value);
                handleEditChange(event, "grade", newValue);
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
        </Grid>
      </TableCell>
      <TableCell align="center" width={"170px"}>
        <Select
          id="course-type"
          name="type"
          onChange={(event, newValue) =>
            handleEditChange(event, "type", newValue)
          }
          value={type}
          variant="outlined"
          size="small"
          fullWidth
        >
          {banksNamesOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </TableCell>
      <TableCell align="center" width={"170px"}>
        {state}
      </TableCell>
      <EditActionCell
        row={editRow}
        handleSave={handleSave}
        handleCancel={handleCancel}
      />
    </>
  );
};

export const EditableRow = EditableRowComp;
