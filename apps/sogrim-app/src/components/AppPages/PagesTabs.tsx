import { Box, Divider, Tab, Tabs } from "@mui/material";
import * as React from "react";
import { RequirmentsPage } from "../Pages/RequirmentPage/RequirmentsTab";
import { SemestersPage } from "../Pages/SemestersPage/SemestersPage";
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
        <Tab sx={{ fontSize: "30px" }} label="דרישות" />
        <Tab sx={{ fontSize: "30px" }} label="סמסטרים" />
      </Tabs>
      <Divider />
      <TabPanel value={value} index={0}>
        <RequirmentsPage />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <SemestersPage />
      </TabPanel>
    </Box>
  );
};
