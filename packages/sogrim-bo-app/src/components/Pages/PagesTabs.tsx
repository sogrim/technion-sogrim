import { Box, Divider, Tab, Tabs } from "@mui/material";
import * as React from "react";

import { TabPanel } from "./TabPanel";

export const PagesTabs: React.FC = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  return (
    <Box sx={{ width: "100%" }}>
      <Tabs
        textColor="secondary"
        indicatorColor="secondary"
        value={value}
        onChange={handleChange}
        centered
      >
        <Tab sx={{ fontSize: "30px" }} label="קטלוגים" />
        <Tab sx={{ fontSize: "30px" }} label="קורסים" />
      </Tabs>
      <Divider />
      <TabPanel value={value} index={0}>
        <h1> קטלוגס </h1>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <h1> קורסים </h1>
      </TabPanel>
    </Box>
  );
};
