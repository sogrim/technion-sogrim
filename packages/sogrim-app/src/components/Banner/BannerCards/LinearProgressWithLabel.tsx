import LinearProgress, {
  LinearProgressProps,
} from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export const LinearProgressWithLabel = (
  props: LinearProgressProps & { value: number }
) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box sx={{ width: "100%" }}>
        <LinearProgress variant="determinate" {...props} color="secondary" />
      </Box>
      <Box sx={{ minWidth: 35, mr: -1 }}>
        <Typography variant="body2" color="text.secondary">
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
};
