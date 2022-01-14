import { useState } from "react";
import { AddSemesterFlow } from "../../../types/ui-types";
import AddIcon from "@mui/icons-material/Add";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Tooltip, Box, ToggleButton } from "@mui/material";

export const SemesterOptionsButton = () => {
  const [addSemesterFlow, setAddSemesterFlow] = useState<AddSemesterFlow>(
    AddSemesterFlow.Idle
  );

  const handleSemesterTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    clickType: AddSemesterFlow
  ) => {
    console.log(clickType);
    setAddSemesterFlow(clickType);
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
            <ToggleButton value={AddSemesterFlow.Regular}>
              <LocalLibraryIcon />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={"סמסטר קיץ"} arrow>
            <ToggleButton value={AddSemesterFlow.Summer}>
              <BeachAccessIcon />
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
