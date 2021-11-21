import * as React from 'react';
import {Box, Tabs, Tab, Divider} from '@mui/material';

export const PagesTabs: React.FC = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
 
  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
      <Tabs textColor="secondary"
            indicatorColor="secondary" value={value} onChange={handleChange} centered>
        <Tab sx={{fontSize: '30px'}} label="מה עשית" />
        <Tab sx={{fontSize: '30px'}} label="מה בתכנון" />
        </Tabs>
        
        <Divider />
    </Box>
  );
}