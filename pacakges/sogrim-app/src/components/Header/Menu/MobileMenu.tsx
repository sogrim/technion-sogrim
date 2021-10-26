import React from 'react';
import { Box, Menu, MenuItem } from '@mui/material';

import { Messages, Notifications, SignOut, Settings } from '../Actions/Actions';

interface MobileMenuProps {
  isMenuOpen: boolean;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  handleMenuClose: () => void;
  anchorEl: HTMLElement | null;
}

export const MobileMenu = ({ isMenuOpen, handleMenuOpen, handleMenuClose, anchorEl }: MobileMenuProps) => {

  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id="primary-search-account-menu-mobile"
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <Box sx={{ textAlign: 'center' }}>                
        <MenuItem onClick={handleMenuClose}>
          <Settings disableTooltip />
          הגדרות
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <SignOut disableTooltip onClick={() => alert('Signing out...')} />
          התנתקות
        </MenuItem>
      </Box>
    </Menu>
  );
};
