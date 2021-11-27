import React from 'react';
import { observer } from 'mobx-react-lite';
import useUserState from '../../../../hooks/apiHooks/useUserState';
import { CourseBankReq } from '../../../../types/data-types';
import { RequirmentItem } from './RequirmentItem';
import { Grid, Box } from '@mui/material';

interface BankRequirmentsProps {
}

const BankRequirmentsComp: React.FC<BankRequirmentsProps> = () => {

    const { data: userState }  = useUserState();

    const banReqList: CourseBankReq[] = userState?.details?.degree_status?.course_bank_requirements || [] as CourseBankReq[];
    
    return (
        <Box sx={{ marginTop: 2}}>            
            <Grid sx={sxPages} container spacing={{ xs: 2, md: 2 }} columns={{ xs: 3 , md: 3 }}>
                { banReqList?.map( (banReq, id) => <RequirmentItem key={id} bankRequirment={banReq}/>) }                          
            </Grid>
        </Box>
    );
};

const sxPages = {
    width: '70%',       
    display: 'flex',      
    justifyContent: 'center',    
}

export const BankRequirments = observer(BankRequirmentsComp);

