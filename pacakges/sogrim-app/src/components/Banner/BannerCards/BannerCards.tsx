import { Box } from '@mui/material';
import { DegreeMainStatus } from './DegreeMainStatus';
import { observer} from 'mobx-react-lite';
import { useStore } from '../../../hooks/useStore';

const BannerCardsComp: React.FC = ({ children }) => {
  
  const { uiStore: { showDegreeStatusCard }} = useStore();

  return (    
        <Box >
          { showDegreeStatusCard ? <DegreeMainStatus /> : null }
         
        </Box>                
     
  );
};

export const BannerCards = observer(BannerCardsComp);