import React from 'react';
import { observer } from 'mobx-react-lite';
import { Box } from '@mui/material';
import { BankRequirments } from './BankRequirments/BankRequirments';
import { CreditOverflow } from './CreditOverflow';

interface RequirmentsTabProps {
}

const RequirmentsTabComp: React.FC<RequirmentsTabProps> = () => {
  
    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 3,
            p: 1,
            m: 1,            
        }}>            
            <BankRequirments />
            <CreditOverflow />
        </Box>
    );
};


export const RequirmentsTab = observer(RequirmentsTabComp);

