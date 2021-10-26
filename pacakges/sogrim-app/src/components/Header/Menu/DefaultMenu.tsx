import { Menu, MenuItem } from '@mui/material';

import { Settings, SignOut } from '../Actions/Actions';

interface DefaultMenuProps {
  isMenuOpen: boolean;
  handleMenuClose: () => void;
  anchorEl: HTMLElement | null;
}

export const DefaultMenu = ({ isMenuOpen, handleMenuClose, anchorEl }: DefaultMenuProps) => (
  <Menu anchorEl={anchorEl} id="primary-search-account-menu" keepMounted open={isMenuOpen} onClose={handleMenuClose}>
    <MenuItem onClick={handleMenuClose}>
      <Settings disableTooltip />
      הגדרות
    </MenuItem>    
    <MenuItem onClick={handleMenuClose}>
      <SignOut disableTooltip />
      התנתקות
    </MenuItem>
  </Menu>
);
