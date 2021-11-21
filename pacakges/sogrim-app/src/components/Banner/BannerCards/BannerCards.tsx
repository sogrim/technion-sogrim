import { Box } from '@mui/material';
import { DegreeMainStatus } from './DegreeMainStatus';
import { observer} from 'mobx-react-lite';

const BannerCardsComp: React.FC = () => {
  return (    
        <Box >
           <DegreeMainStatus />          
        </Box>                
     
  );
};

export const BannerCards = observer(BannerCardsComp);