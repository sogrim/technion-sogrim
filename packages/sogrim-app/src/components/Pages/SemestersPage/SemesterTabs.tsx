import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Tabs, { tabsClasses } from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { TabPanel } from '../../AppPages/TabPanel';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../../hooks/useStore';
import useUserState from '../../../hooks/apiHooks/useUserState';
import { useAuth } from '../../../hooks/useAuth';
import { SemesterTable } from './SemesterTable/SemesterTable';

const SemesterTabsComp = () => {

  const [allSemesters, setAllSemesters] = useState<string[] | null>(null)
  const { userAuthToken } = useAuth();
  const { data, isLoading } = useUserState(userAuthToken);

  const { uiStore: {
          semesterTab: value,
          setSemesterTab,
          },
          dataStore: {
            getAllUserSemesters,
            generateRows
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
      if (data?.details?.degree_status?.course_statuses) {
        setAllSemesters(getAllUserSemesters(data.details.degree_status.course_statuses));
      }
    }    
  }, [data, getAllUserSemesters, isLoading])

  return (
    <Box  sx={{
            minWidth: 1100,
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
                                                  label={semesterNaming(semester)} key={index} />)}
        </Tabs>     
          { allSemesters?.map( (semester, index) => 
          <Box sx={{ display: 'flex', justifyContent: 'center', }}  key={index}> 
             <TabPanel value={value} index={index} >
              {(data?.details?.degree_status?.course_statuses) ? 
              <SemesterTable  rows={generateRows(semester, data.details.degree_status.course_statuses)}
                              semester={semester} /> : null}
            </TabPanel>
          </Box>
          )}
    </Box>
);  
}

export const SemesterTabs = observer(SemesterTabsComp);