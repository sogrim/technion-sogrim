import { Box, Skeleton, Typography } from "@mui/material";
export default function LoadingEndGameSkeleton() {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="h4" component="div">
        מחשב את סוף התואר ...
      </Typography>
      <Skeleton />
      <Skeleton />
      <Skeleton />
    </Box>
  );
}
