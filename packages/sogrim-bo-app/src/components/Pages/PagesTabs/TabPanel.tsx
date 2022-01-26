import * as React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  children,
  index,
  value,
}) => {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
    >
      <Box sx={sxPages}>
        {value === index && <Typography component="div">{children}</Typography>}
      </Box>
    </Box>
  );
};
const sxPages = {
  width: "100%",
  marginTop: "20px",
  height: 500,
  display: "flex",
  justifyContent: "center",
};
