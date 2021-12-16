import { Menu, MenuItem } from '@mui/material';
import { useAuth } from '../../../hooks/useAuth';
import { observer } from 'mobx-react-lite'
import { Settings, SignOut } from '../Actions/Actions';

interface DefaultMenuProps {
  isMenuOpen: boolean;
  handleMenuClose: () => void;
  anchorEl: HTMLElement | null;
}

const DefaultMenuComp = ({ isMenuOpen, handleMenuClose, anchorEl }: DefaultMenuProps) =>  {
  
  const { logout } = useAuth();
  
  return (  
  <Menu anchorEl={anchorEl} id="primary-search-account-menu" keepMounted open={isMenuOpen} onClose={handleMenuClose}>
    <MenuItem onClick={handleMenuClose}>
      <Settings disableTooltip />
      הגדרות
    </MenuItem>    
    <MenuItem onClick={handleMenuClose}>
      <SignOut disableTooltip onClick={logout} />
      התנתקות
    </MenuItem>
  </Menu>
)};

export const DefaultMenu = observer(DefaultMenuComp);
