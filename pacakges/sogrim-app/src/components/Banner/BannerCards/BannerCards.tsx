import { Box } from '@mui/material';
import { DegreeMainStatus } from './DegreeMainStatus';
import { observer} from 'mobx-react-lite';
import { useStore } from '../../../hooks/useStore';

const BannerCardsComp: React.FC = () => {
  const { uiStore: { showMainStatus } } = useStore();

  return (    
        <Box >
           <DegreeMainStatus />          
          {/* { !showMainStatus ? 
          <VerticalLinearStepper /> :
          <DegreeMainStatus />  } */}
        </Box>                
     
  );
};

export const BannerCards = observer(BannerCardsComp);