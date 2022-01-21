import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { AppBar, Box, Theme, Toolbar } from "@mui/material";

import { AppTitle } from "./AppTitle/AppTitle";
import { DefaultMenu } from "./Menu";
import { useAuth } from "../../hooks/useAuth";
import { UserAccount } from "./Actions/Actions";

interface HeaderProps {}

const HeaderComp: React.FC<HeaderProps> = () => {
  const { isAuthenticated } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <AppBar position="fixed" sx={sxAppBar}>
        <Toolbar disableGutters variant="dense">
          <AppTitle />
          <Box sx={{ flexGrow: 1 }} />
          <Box
            sx={{
              display: {
                xs: "none",
                md: "flex",
                alignItems: "center",
                margin: "80px",
              },
            }}
          >
            {isAuthenticated ? (
              <UserAccount onClick={handleProfileMenuOpen} />
            ) : null}
          </Box>
        </Toolbar>
      </AppBar>
      <DefaultMenu
        isMenuOpen={Boolean(anchorEl)}
        handleMenuClose={handleMenuClose}
        anchorEl={anchorEl}
      />
    </>
  );
};

export const Header = observer(HeaderComp);

const sxAppBar = {
  zIndex: (theme: Theme) => theme.zIndex.drawer + 1,
  bgcolor: (theme: Theme) => theme.palette.common.white,
  height: 80,
  display: "flex",
  justifyContent: "center",
};
