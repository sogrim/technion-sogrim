import Box from "@mui/material/Box";
import * as React from "react";

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
      width="100%"
    >
      {value === index && <Box sx={sxPages}>{children}</Box>}
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
