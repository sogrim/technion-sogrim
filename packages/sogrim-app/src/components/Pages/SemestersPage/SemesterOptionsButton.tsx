import { useState } from "react";
import { SemesterOptions } from "../../../types/ui-types";
import AddIcon from "@mui/icons-material/Add";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import CancelPresentationIcon from "@mui/icons-material/CancelPresentation";
import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Tooltip, Box, ToggleButton } from "@mui/material";

interface SemesterOptionsButtonProps {
  handleAddSemester: (semesterType: SemesterOptions) => void;
  handleDeleteSemester: () => void;
}
export const SemesterOptionsButton: React.FC<SemesterOptionsButtonProps> = ({
  handleAddSemester,
  handleDeleteSemester,
}) => {
  const [semesterFlow, setAddSemesterFlow] = useState<SemesterOptions>(
    SemesterOptions.Idle
  );

  const handleSemesterTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    clickType: SemesterOptions
  ) => {
    setAddSemesterFlow(clickType);
  };

  const clickControl = (semesterType: SemesterOptions) => {
    if (semesterType !== SemesterOptions.Idle) {
      handleAddSemester(semesterType);
    }
    setAddSemesterFlow(SemesterOptions.Idle);
  };

  const clickDeleteCurrentSemester = () => {
    setAddSemesterFlow(SemesterOptions.Delete);
  };

  const clickConfirmDeleteCurrentSemester = () => {
    setAddSemesterFlow(SemesterOptions.Idle);
    handleDeleteSemester();
  };

  return (
    <Box sx={{ display: "flex" }}>
      {semesterFlow === SemesterOptions.Idle ? (
        <Tooltip title={"הוסף סמסטר"} arrow>
          <IconButton
            onClick={(event) =>
              handleSemesterTypeChange(event, SemesterOptions.Regular)
            }
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      ) : (
        semesterFlow !== SemesterOptions.Delete && (
          <Box sx={{ display: "flex" }}>
            <Tooltip title={"סמסטר רגיל"} arrow>
              <ToggleButton
                value={SemesterOptions.Regular}
                onClick={() => clickControl(SemesterOptions.Regular)}
              >
                <LocalLibraryIcon />
              </ToggleButton>
            </Tooltip>
            <Tooltip title={"סמסטר קיץ"} arrow>
              <ToggleButton
                value={SemesterOptions.Summer}
                onClick={() => clickControl(SemesterOptions.Summer)}
              >
                <BeachAccessIcon />
              </ToggleButton>
            </Tooltip>
            <Tooltip title={"בטל"} arrow>
              <ToggleButton
                value={SemesterOptions.Regular}
                onClick={() => clickControl(SemesterOptions.Idle)}
              >
                <CancelPresentationIcon />
              </ToggleButton>
            </Tooltip>
          </Box>
        )
      )}
      {semesterFlow === SemesterOptions.Idle ? (
        <Tooltip title={"מחק סמסטר נוכחי"} arrow>
          <IconButton onClick={clickDeleteCurrentSemester}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        semesterFlow === SemesterOptions.Delete && (
          <>
            <Tooltip title={"בטל"} arrow>
              <IconButton
                value={SemesterOptions.Regular}
                onClick={() => clickControl(SemesterOptions.Idle)}
              >
                <CancelPresentationIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={"האם אתה בטוח? לחץ לאישור מחיקה"} arrow>
              <IconButton
                color={"secondary"}
                onClick={clickConfirmDeleteCurrentSemester}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        )
      )}
    </Box>
  );
};
