import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Box } from '@mui/material';

interface CompleteTabProps {
}

const CompleteTabComp: React.FC<CompleteTabProps> = () => {
    return (
        <>
        Hi
        </>
    );
};

export const CompleteTab = observer(CompleteTabComp);
