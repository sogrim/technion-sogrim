import { LinearProgress, Box, Typography } from "@mui/material";

export const LinearProgressBar: React.FC<{ value: number }> = ({ value }) => {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          marginTop: "18px",
          marginLeft: "10px",
        }}
      >
        <LinearProgress
          color={"secondary"}
          variant="determinate"
          value={value}
        />
        <Typography
          variant="caption"
          component="div"
          color="text.secondary"
        >{`${Math.round(value)}%`}</Typography>
      </Box>
    </>
  );
};
