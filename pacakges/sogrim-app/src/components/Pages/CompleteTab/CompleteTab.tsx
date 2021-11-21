import React from 'react';
import { observer } from 'mobx-react-lite';
import { BankRequirments } from './BankRequirments/BankRequirments';

interface CompleteTabProps {
}

const CompleteTabComp: React.FC<CompleteTabProps> = () => {
    return (
        <>
          <BankRequirments />
        </>
    );
};

export const CompleteTab = observer(CompleteTabComp);
