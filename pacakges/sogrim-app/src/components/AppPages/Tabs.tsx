import * as React from 'react';
import {Box, Tabs, Tab, Divider} from '@mui/material';
import { TabPanel } from './TabPanel';
import { CompleteTab } from '../Pages/CompleteTab/CompleteTab';

export const PagesTabs: React.FC = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
 
  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
      <Tabs textColor="secondary"
            indicatorColor="secondary" value={value} onChange={handleChange} centered>
        <Tab sx={{fontSize: '30px'}} label="דרישות" />
        <Tab sx={{fontSize: '30px'}} label="סמסטרים" />
        </Tabs>        
        <Divider />
        <TabPanel value={value} index={0}>
          <CompleteTab />
        </TabPanel>
        <TabPanel value={value} index={1}>
          🦈 🔨 🦈 🔨 🦈 🔨 🦈 🔨 🦈 🔨  
        </TabPanel>
    </Box>
  );
}
