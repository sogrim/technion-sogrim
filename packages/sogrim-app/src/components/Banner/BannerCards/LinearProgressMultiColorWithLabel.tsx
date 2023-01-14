import { Tooltip } from "@mui/material";
import Box from "@mui/material/Box";
import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";
import { styled, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { DARK_MODE_THEME } from "../../../themes/constants";

export const LinearProgressMultiColorWithLabel = (props: {
  onlyCompleteProgress: number;
  totalProgress: number;
}) => {
  const theme = useTheme();
  const MultiColorLinearProgress = styled(LinearProgress)(({ theme }) => ({
    [`& .${linearProgressClasses.dashed}`]: {
      backgroundImage: "none",
      backgroundColor:
        theme.palette.mode === DARK_MODE_THEME
          ? theme.palette.secondary.dark
          : "rgba(0, 0, 0, 0.178)",
      animation: "none",
    },

    [`& .${linearProgressClasses.bar1Buffer}`]: {
      backgroundColor: theme.palette.secondary.main,
    },
    [`& .${linearProgressClasses.bar2Buffer}`]: {
      backgroundColor: theme.palette.secondary.light,
    },
  }));

  return (
    <Tooltip
      title={`קורסים שהושלמו - ${Math.round(
        props.onlyCompleteProgress
      )}%, קורסים בתהליך - ${Math.round(
        props.totalProgress - props.onlyCompleteProgress
      )}%`}
      arrow
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: "100%" }}>
          <MultiColorLinearProgress
            variant="buffer"
            valueBuffer={props.totalProgress}
            value={props.onlyCompleteProgress}
            theme={{ ...theme }}
          />
        </Box>
        <Box
          sx={{ display: "flex", flexDirection: "row", minWidth: 35, mr: -1 }}
        >
          <Typography variant="body2">
            {`${Math.round(props.totalProgress)}%`}
            <span style={{ color: "red", fontWeight: "bold" }}>*</span>
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
};
