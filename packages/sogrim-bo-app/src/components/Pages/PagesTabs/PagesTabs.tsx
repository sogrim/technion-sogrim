import { Box, Divider, Tab, Tabs } from "@mui/material";
import * as React from "react";
import { CatalogsPage } from "../CatalogsPage/CatalogsPage";
import { CoursePage } from "../CoursesPage/CoursePage";

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
        <CatalogsPage />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <CoursePage />
      </TabPanel>
    </Box>
  );
};
