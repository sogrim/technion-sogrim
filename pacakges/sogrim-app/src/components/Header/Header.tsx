import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { AppBar, Box, Theme, Toolbar } from '@mui/material';

import { AppTitle } from './AppTitle/AppTitle';
import { More, UserAccount } from './Actions/Actions';
import { DefaultMenu, MobileMenu } from './Menu';
import { useAuth } from '../../hooks/useAuth';
import { SogrimButton } from '../Commom/SogrimButton';

interface HeaderProps {
  toggleNavigation: () => void;
}

const HeaderComp = ({ toggleNavigation }: HeaderProps) => {
  
  const { isAuthenticated, setDummyAuthenticated } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState<null | HTMLElement>(null);

  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setMobileMoreAnchorEl(event.currentTarget);

  const handleMobileMenuClose = () => setMobileMoreAnchorEl(null);

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };



  return (
    <>
      <AppBar position="fixed" sx={sxAppBar}>
        <Toolbar disableGutters variant="dense">
          <AppTitle />
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: 'none', md: 'flex', alignItems: 'center', margin: '80px' } }}>            
            { isAuthenticated ? <UserAccount onClick={handleProfileMenuOpen} /> : null }
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <More onClick={handleMobileMenuOpen} />
          </Box>
        </Toolbar>
      </AppBar>
      <MobileMenu
        isMenuOpen={!!mobileMoreAnchorEl}
        handleMenuOpen={handleMobileMenuOpen}
        handleMenuClose={handleMobileMenuClose}
        anchorEl={mobileMoreAnchorEl}
      />
      <DefaultMenu isMenuOpen={Boolean(anchorEl)} handleMenuClose={handleMenuClose} anchorEl={anchorEl} />
    </>
  );
};

export const Header = observer(HeaderComp);

const sxAppBar = {   
  zIndex: (theme: Theme) => theme.zIndex.drawer + 1,
  bgcolor: (theme: Theme) => theme.palette.common.white,  
  height: 80,
  display: 'flex',  
  justifyContent: 'center',
 }

 