import * as React from 'react';
import Box from '@mui/material/Box';
import Tabs, { tabsClasses } from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { TabPanel } from '../../AppPages/TabPanel';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../../hooks/useStore';

const SemesterTabsComp = () => {

    const { uiStore: {
        semesterTab: value,
        setSemesterTab,
    }} = useStore();

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
      setSemesterTab(newValue);
    };

    return (
      <Box  sx={{
              maxWidth: 800,
            [`& .${tabsClasses.scrollButtons}`]: {
              '&.Mui-disabled': { opacity: 0.3 },
            },
          }}>
        <Tabs textColor="primary"
              indicatorColor="primary"
              value={value} 
              onChange={handleChange}
              variant="scrollable"
              scrollButtons
          >
          <Tab sx={{fontSize: '30px'}} label="1" />
          <Tab sx={{fontSize: '30px'}} label="2" />
          <Tab sx={{fontSize: '30px'}} label="1" />
          <Tab sx={{fontSize: '30px'}} label="2" />
          <Tab sx={{fontSize: '30px'}} label="1" />
          <Tab sx={{fontSize: '30px'}} label="2" />
          <Tab sx={{fontSize: '30px'}} label="1" />
          <Tab sx={{fontSize: '30px'}} label="2" />
          <Tab sx={{fontSize: '30px'}} label="1" />
          <Tab sx={{fontSize: '30px'}} label="2" />
          <Tab sx={{fontSize: '30px'}} label="1" />
          <Tab sx={{fontSize: '30px'}} label="2" />
          </Tabs>                
          <TabPanel value={value} index={0}>
            הוגלה
          </TabPanel>
          <TabPanel value={value} index={1}>
            בוגלה
          </TabPanel>
      </Box>
  );  
}

export const SemesterTabs = observer(SemesterTabsComp);