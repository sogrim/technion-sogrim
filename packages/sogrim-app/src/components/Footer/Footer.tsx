import { Box, Link, Typography } from "@mui/material";
import octo from "../../assets/octo.jpg";

export const Footer: React.FC = () => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 3,
        left: 3,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", marginTop: 15 }}>
        <Typography> מוגש בחום ואהבה מצוות סוגרים 🤓</Typography>
        <Box sx={{ display: "flex" }}>
          <Link
            href="https://github.com/sogrim/technion-sogrim"
            underline="hover"
            target="_blank"
            rel="noopener"
          >
            <img
              src={octo}
              alt={"githubocto"}
              style={{ height: "18px", width: "18px" }}
            />
          </Link>
        </Box>
      </Box>
    </div>
  );
};
