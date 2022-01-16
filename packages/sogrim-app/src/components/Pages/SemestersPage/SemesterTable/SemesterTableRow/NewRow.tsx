import AutoFixNormalOutlinedIcon from "@mui/icons-material/AutoFixNormalOutlined";
import {
  Grid,
  IconButton,
  MenuItem,
  Select,
  TableCell,
  TextField,
  Tooltip,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useStore } from "../../../../../hooks/useStore";
import { courseGradeOptions, RowData } from "../SemesterTabsConsts";
import { NewRowActionCell } from "./NewRowActionCell";

export interface NewRowProps {
  newRow: RowData;
  handleEditChange: any;
  handleAdd: any;
  handleCancel: any;
  labelId: string;
}

const NewRowComp: React.FC<NewRowProps> = ({
  newRow,
  handleEditChange,
  handleCancel,
  handleAdd,
  labelId,
}) => {
  const {
    dataStore: { getUserBankNames },
  } = useStore();

  const { name, courseNumber, credit, grade } = newRow;

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
          value={name}
          variant="outlined"
          size="small"
        />
      </TableCell>
      <TableCell align="center" width={"150px"}>
        <TextField
          id="course-number"
          name="courseNumber"
          onChange={handleEditChange}
          value={courseNumber}
          variant="outlined"
          size="small"
        />
      </TableCell>
      <TableCell align="center" width={"80px"}>
        <TextField
          id="course-credit"
          name="credit"
          onChange={handleEditChange}
          value={credit}
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
          value={newRow.type}
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
        {newRow.state}
      </TableCell>
      <NewRowActionCell handleAdd={handleAdd} handleCancel={handleCancel} />
    </>
  );
};

export const NewRow = NewRowComp;
