import LinearProgress, {
  linearProgressClasses,
  LinearProgressProps,
} from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { styled, useTheme } from "@mui/material/styles";
import { Tooltip } from "@mui/material";

export const LinearProgressMultiColorWithLabel = (
  props: LinearProgressProps & {
    onlyCompleteProgress: number;
    totalProgress: number;
  }
) => {
  const theme = useTheme();
  const MultiColorLinearProgress = styled(LinearProgress)(({ theme }) => ({
    [`& .${linearProgressClasses.dashed}`]: {
      backgroundImage: "none",
      backgroundColor: "rgba(0, 0, 0, 0.178)",
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
            {...props}
            variant="buffer"
            valueBuffer={props.totalProgress}
            value={props.onlyCompleteProgress}
            theme={{ ...theme }}
          />
        </Box>
        <Box
          sx={{ display: "flex", flexDiretion: "row", minWidth: 35, mr: -1 }}
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
