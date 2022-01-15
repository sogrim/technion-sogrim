import { useState } from "react";
import { AddSemesterFlow } from "../../../types/ui-types";
import AddIcon from "@mui/icons-material/Add";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import CancelPresentationIcon from "@mui/icons-material/CancelPresentation";
import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Tooltip, Box, ToggleButton } from "@mui/material";

interface SemesterOptionsButtonProps {
  handleAddSemester: (semesterType: AddSemesterFlow) => void;
}
export const SemesterOptionsButton: React.FC<SemesterOptionsButtonProps> = ({
  handleAddSemester,
}) => {
  const [addSemesterFlow, setAddSemesterFlow] = useState<AddSemesterFlow>(
    AddSemesterFlow.Idle
  );

  const handleSemesterTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    clickType: AddSemesterFlow
  ) => {
    setAddSemesterFlow(clickType);
  };

  const clickAddSemester = (semesterType: AddSemesterFlow) => {
    if (semesterType !== AddSemesterFlow.Idle) {
      handleAddSemester(semesterType);
    }
    setAddSemesterFlow(AddSemesterFlow.Idle);
  };

  const clickDeleteCurrentSemester = () => {
    setAddSemesterFlow(AddSemesterFlow.Idle);
  };

  return (
    <Box sx={{ display: "flex" }}>
      {addSemesterFlow === AddSemesterFlow.Idle ? (
        <Tooltip title={"הוסף סמסטר"} arrow>
          <IconButton
            onClick={(event) =>
              handleSemesterTypeChange(event, AddSemesterFlow.Regular)
            }
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Box sx={{ display: "flex" }}>
          <Tooltip title={"סמסטר רגיל"} arrow>
            <ToggleButton
              value={AddSemesterFlow.Regular}
              onClick={() => clickAddSemester(AddSemesterFlow.Regular)}
            >
              <LocalLibraryIcon />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={"סמסטר קיץ"} arrow>
            <ToggleButton
              value={AddSemesterFlow.Summer}
              onClick={() => clickAddSemester(AddSemesterFlow.Summer)}
            >
              <BeachAccessIcon />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={"בטל"} arrow>
            <ToggleButton
              value={AddSemesterFlow.Regular}
              onClick={() => clickAddSemester(AddSemesterFlow.Idle)}
            >
              <CancelPresentationIcon />
            </ToggleButton>
          </Tooltip>
        </Box>
      )}
      {addSemesterFlow === AddSemesterFlow.Idle && (
        <Tooltip title={"מחק סמסטר נוכחי"} arrow>
          <IconButton
            onClick={(event) =>
              handleSemesterTypeChange(event, AddSemesterFlow.Regular)
            }
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};
