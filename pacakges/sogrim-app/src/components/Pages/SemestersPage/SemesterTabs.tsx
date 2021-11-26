import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Tabs, { tabsClasses } from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { TabPanel } from '../../AppPages/TabPanel';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../../hooks/useStore';
import useUserState from '../../../hooks/apiHooks/useUserState';
import { useAuth } from '../../../hooks/useAuth';

const SemesterTabsComp = () => {

  const [allSemesters, setAllSemesters] = useState<string[] | null>(null)
  const { userAuthToken } = useAuth();
  const { data, isLoading, isError} = useUserState(userAuthToken);

  const { uiStore: {
          semesterTab: value,
          setSemesterTab,
          },
          dataStore: {
            getAllUserSemesters
          }
      } = useStore();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setSemesterTab(newValue);
  };

  const semesterNaming = (semesterName: string): string => {
    const name = semesterName.replace('_', ' ');
    const splitName = name.split(' ')
    if(splitName[0] === 'קיץ') {
      return splitName[0];
    }
    return name;
  }

  useEffect(() => {
    if(data && !isLoading) {
      if (data.details.degree_status.course_statuses) {
        setAllSemesters(getAllUserSemesters(data.details.degree_status.course_statuses));
      }
    }    
  }, [data, isLoading])

  return (
    <Box  sx={{
            maxWidth: 1100,
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
          { allSemesters?.map( (semester, index) => <Tab sx={{fontSize: '30px'}} 
              label={semesterNaming(semester)} key={semester} />)}
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