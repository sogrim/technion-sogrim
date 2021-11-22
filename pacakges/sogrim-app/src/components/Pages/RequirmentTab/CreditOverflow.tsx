
import React from 'react';
import { observer } from 'mobx-react-lite';
import useUserState from '../../../hooks/apiHooks/useUserState';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

interface CreditOverflowProps {
}

const CreditOverflowComp: React.FC<CreditOverflowProps> = () => {

    const { data: userState }  = useUserState();

    const overflowMsg: string[] = userState?.details?.degree_status?.credit_overflow_msgs || [];

    return (
        <div>
        <Accordion sx={{ minWidth: 600}}>
            <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="overflow-collaps"
            id="overflow-collaps"          
            >
            <Typography>מעבר נקודות בין דרישות</Typography>
            </AccordionSummary>
            <AccordionDetails>
            { overflowMsg.map( (ovm, id) => <Typography key={id}> {ovm} </Typography>)}
            </AccordionDetails>
        </Accordion>      
        </div>
    );
};

export const CreditOverflow = observer(CreditOverflowComp);

