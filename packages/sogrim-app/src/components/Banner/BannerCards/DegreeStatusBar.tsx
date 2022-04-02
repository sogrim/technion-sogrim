import Box from "@mui/material/Box";
import { LinearProgressMultiColorWithLabel } from "./LinearProgressMultiColorWithLabel";
import { LinearProgressWithLabel } from "./LinearProgressWithLabel";

export const DegreeStatusBar = ({
  coursesCompleteProgress = 0,
  coursesTotalProgress = 0,
  computeInProgress = false,
}: {
  coursesCompleteProgress: number;
  coursesTotalProgress: number;
  computeInProgress: boolean;
}) => {
  return computeInProgress ? (
    <Box sx={{ width: "100%" }}>
      <LinearProgressMultiColorWithLabel
        onlyCompleteProgress={coursesCompleteProgress}
        totalProgress={coursesTotalProgress}
      />
    </Box>
  ) : (
    <Box sx={{ width: "100%" }}>
      <LinearProgressWithLabel value={coursesCompleteProgress} />
    </Box>
  );
};
