import React, { ComponentType } from 'react';
import { IconButton, Tooltip, Avatar } from '@mui/material';

import { ActionIcon } from './ActionIcon';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../../hooks/useStore';

interface ActionItemProps {
  title: string;
  icon: ComponentType;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  badgeContent?: number;
  disableTooltip?: boolean;
  avatar?: boolean;
}

const ActionItemComp = ({ title, icon, onClick, badgeContent, disableTooltip = false, avatar = false, }: ActionItemProps) => {

    const { dataStore: {
    userState,
  }} = useStore();

  const us = {...userState}

  const actionType = avatar ? <Avatar src={us?.picture ?? ''}/> : <ActionIcon badgeContent={badgeContent} icon={icon} />
  const buttonIcon = <IconButton size="large" color="primary" onClick={onClick}> {actionType} </IconButton>

  return disableTooltip ? (
    buttonIcon
  ) : (
    <Tooltip title={title} placement="bottom" arrow>
      {buttonIcon}
    </Tooltip>
  );
};

export const ActionItem = observer(ActionItemComp);
