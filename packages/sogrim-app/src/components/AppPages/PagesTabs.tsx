import { Box, Divider, Tab, Tabs, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { useStore } from "../../hooks/useStore";
import { RequirementsPage } from "../Pages/RequirementPage/RequirementsTab";
import { Semester0Page } from "../Pages/Semester0Page/Semester0Page";
import { SemestersPage } from "../Pages/SemestersPage/SemestersPage";
import { TabPanel } from "./TabPanel";

const PagesTabsComp: React.FC = () => {
  const [value, setValue] = React.useState(0);

  const {
    uiStore: { emptyStateAdminMode },
  } = useStore();
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  return (
    <Box sx={{ width: "100%" }}>
      {emptyStateAdminMode ? (
        <Typography
          variant="h4"
          align="center"
          color="text.secondary"
          sx={{ paddingTop: 4 }}
        >
          כדי להתחיל, יש לבחור קטלוג ולהעתיק את גיליון הציונים
        </Typography>
      ) : (
        <>
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
        </>
      )}
    </Box>
  );
};

export const PagesTabs = observer(PagesTabsComp);
