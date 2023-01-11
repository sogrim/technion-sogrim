import { Box, Divider, Tab, Tabs } from "@mui/material";
import * as React from "react";
import { RequirementsPage } from "../Pages/RequirementPage/RequirementsTab";
import { Semester0Page } from "../Pages/Semester0Page/Semester0Page";
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
        <Tab sx={{ fontSize: "30px" }} label="פטורים וזיכויים" />
      </Tabs>
      <Divider />
      <TabPanel value={value} index={0}>
        <RequirementsPage />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <SemestersPage />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Semester0Page />
      </TabPanel>
    </Box>
  );
};
