import AutoFixNormalOutlinedIcon from "@mui/icons-material/AutoFixNormalOutlined";
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  GridRenderCellParams,
  GridRenderEditCellParams,
  useGridApiContext,
} from "@mui/x-data-grid";
import { useState } from "react";
import { courseGradeOptions } from "../SemesterTabsConsts";

interface EditGradeCellCompParams extends GridRenderCellParams {
  isSemester0: boolean;
}

const EditGradeCellComp = (props: EditGradeCellCompParams) => {
  const [displayValue, setDisplayValue] = useState<string>(props.row.grade);

  const [gradeToggle, setGradeToggle] = useState<boolean>(true);
  const [nonNumericGrade, setNonNumericGrade] = useState<string>("");

  const gradeToggleClick = () => {
    setNonNumericGrade("");
    setGradeToggle(!gradeToggle);
  };

  const { id, field } = props;
  const api = useGridApiContext();

  const handleChangeSelect = async (event: SelectChangeEvent) => {
    event.preventDefault();
    const value = event.target.value;
    setDisplayValue(value);
    setNonNumericGrade(value);
    api.current.setEditCellValue({ id, field, value }, event);
  };

  const handleChangeNumber = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    const value = event.target.value;
    setDisplayValue(value);
    api.current.setEditCellValue({ id, field, value }, event);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", p: 1 }}>
      {!props.isSemester0 && (
        <Tooltip title={gradeToggle ? "ציון לא מספרי" : "ציון מספרי"} arrow>
          <IconButton color="primary" onClick={gradeToggleClick}>
            <AutoFixNormalOutlinedIcon />
          </IconButton>
        </Tooltip>
      )}
      {gradeToggle && !props.isSemester0 ? (
        <TextField
          id="course-grade"
          value={displayValue}
          name="grade"
          onChange={handleChangeNumber}
          label={displayValue}
          variant="outlined"
          size="small"
          type="number"
        />
      ) : (
        <Select
          id="course-grade"
          value={nonNumericGrade}
          name="grade"
          onChange={handleChangeSelect}
          variant="outlined"
          size="small"
          sx={{ width: "140px" }}
        >
          {courseGradeOptions
            .filter((option) => !props.isSemester0 || option.includes("פטור"))
            .map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
        </Select>
      )}
    </Box>
  );
};

const EditGradeCell = EditGradeCellComp;

export function renderGradeEditInputCell(
  params: GridRenderEditCellParams,
  isSemester0: boolean
) {
  // Send params and isSemester0 to EditGradeCell
  return <EditGradeCell {...params} isSemester0={isSemester0} />;
}
