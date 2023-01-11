import React from "react";
import { observer } from "mobx-react-lite";
import { SemesterGrid } from "../SemestersPage/SemesterGrid/SemesterGrid";
import { useStore } from "../../../hooks/useStore";
import LoadingEndGameSkeleton from "../../Common/LoadingEndGameSkeleton";
import { Box } from "@mui/material";
import { MAX_GRID_WIDTH } from "../SemestersPage/SemesterGrid/semester-grid-interface";

const Semester0PageComp: React.FC = () => {
  const {
    uiStore: { endGameLoading },
  } = useStore();

  return (
    <Box sx={{ width: "80%", maxWidth: MAX_GRID_WIDTH }}>
      {endGameLoading ? (
        <LoadingEndGameSkeleton />
      ) : (
        <SemesterGrid {...{ semester: null }} />
      )}
    </Box>
  );
};

export const Semester0Page = observer(Semester0PageComp);
