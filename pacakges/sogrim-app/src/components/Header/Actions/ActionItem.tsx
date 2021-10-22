import React, { ComponentType } from 'react';
import { IconButton, Tooltip, Avatar } from '@mui/material';

import { ActionIcon } from './ActionIcon';

interface ActionItemProps {
  title: string;
  icon: ComponentType;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  badgeContent?: number;
  disableTooltip?: boolean;
  avatar?: boolean;
}

export const ActionItem = ({ title, icon, onClick, badgeContent, disableTooltip = false, avatar = false, }: ActionItemProps) => {
  const actionType = avatar ? <Avatar /> : <ActionIcon badgeContent={badgeContent} icon={icon} />
  const buttonIcon = <IconButton size="large" color="primary" onClick={onClick}> {actionType} </IconButton>

  return disableTooltip ? (
    buttonIcon
  ) : (
    <Tooltip title={title} placement="bottom" arrow>
      {buttonIcon}
    </Tooltip>
  );
};
