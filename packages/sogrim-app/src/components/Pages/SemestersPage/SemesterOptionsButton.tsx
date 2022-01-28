import { useEffect, useState } from "react";
import { SemesterOptions } from "../../../types/ui-types";
import AddIcon from "@mui/icons-material/Add";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import CancelPresentationIcon from "@mui/icons-material/CancelPresentation";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  IconButton,
  Tooltip,
  Box,
  ToggleButton,
  Typography,
} from "@mui/material";

interface SemesterOptionsButtonProps {
  allSemesters: string[] | null;
  handleAddSemester: (semesterType: SemesterOptions) => void;
  handleDeleteSemester: () => void;
}
export const SemesterOptionsButton: React.FC<SemesterOptionsButtonProps> = ({
  allSemesters,
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
    if (allSemesters !== null && allSemesters.length === 0) {
      setAddSemesterFlow(SemesterOptions.Empty);
    }
  };

  useEffect(() => {
    if (allSemesters !== null && allSemesters.length === 0) {
      setAddSemesterFlow(SemesterOptions.Empty);
    }
  }, [allSemesters]);

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
      ) : semesterFlow === SemesterOptions.Empty ? (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="h5" sx={{ ml: 2.5 }}>
            באיזה סמסטר התחלתם את התואר? חורף או אביב?
          </Typography>
          <Tooltip title={<Typography>סמסטר חורף</Typography>} arrow>
            <ToggleButton
              value={SemesterOptions.Winter}
              onClick={() => clickControl(SemesterOptions.Winter)}
            >
              <AcUnitIcon />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={<Typography>סמסטר אביב</Typography>} arrow>
            <ToggleButton
              value={SemesterOptions.Spring}
              onClick={() => clickControl(SemesterOptions.Spring)}
            >
              <LocalFloristIcon />
            </ToggleButton>
          </Tooltip>
        </Box>
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
              <>
                <ToggleButton
                  disabled={
                    !!allSemesters &&
                    !!(allSemesters.length > 0) &&
                    allSemesters[allSemesters.length - 1].includes("קיץ")
                  }
                  value={SemesterOptions.Summer}
                  onClick={() => clickControl(SemesterOptions.Summer)}
                >
                  <BeachAccessIcon />
                </ToggleButton>
              </>
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
