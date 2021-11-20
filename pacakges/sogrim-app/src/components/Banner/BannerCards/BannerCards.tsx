import { Box } from '@mui/material';
import { DegreeMainStatus } from './DegreeMainStatus';
import { observer} from 'mobx-react-lite';

import useUserState from '../../../hooks/apiHooks/useUserState';
import { useState, useEffect } from 'react';

const BannerCardsComp: React.FC = () => {
   
  const { data } = useUserState();
  const [ showMainStatus, setShowMainStatus] = useState<boolean>(false);
  
  // TODO: loading? or loading to all the banner!
  useEffect(() => {    
    if (data?.details?.degree_status?.total_credit) {
      const con = data?.details?.degree_status?.total_credit > 0;
      setShowMainStatus(con);
    }    
  }, [data])

  console.log(data);

  return (    
        <Box >
          { showMainStatus ? <DegreeMainStatus /> : null }         
        </Box>                
     
  );
};

export const BannerCards = observer(BannerCardsComp);