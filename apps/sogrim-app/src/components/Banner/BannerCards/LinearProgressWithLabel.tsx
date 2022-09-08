import Box from "@mui/material/Box";
import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

export const LinearProgressWithLabel = (props: { value: number }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box sx={{ width: "100%" }}>
        <LinearProgress
          value={props.value}
          variant="determinate"
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.178)",
            [`& .${linearProgressClasses.bar}`]: {
              backgroundColor: theme.palette.secondary.main,
            },
          }}
        />
      </Box>
      <Box sx={{ minWidth: 35, mr: -1 }}>
        <Typography variant="body2" color="text.secondary">
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
};
