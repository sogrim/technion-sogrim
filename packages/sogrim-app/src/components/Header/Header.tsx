import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { AppBar, Box, Theme, Toolbar, Button } from "@mui/material";

import { AppTitle } from "./AppTitle/AppTitle";
import { More, UserAccount } from "./Actions/Actions";
import { DefaultMenu, MobileMenu } from "./Menu";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";
import { PageState } from "../../types/ui-types";

interface HeaderProps {}

const HeaderComp: React.FC<HeaderProps> = () => {
  const { isAuthenticated } = useAuth();

  const {
    uiStore: { currentPage, setPage },
  } = useStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] =
    useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
    setMobileMoreAnchorEl(event.currentTarget);

  const handleMobileMenuClose = () => setMobileMoreAnchorEl(null);

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const navButtonText =
    currentPage === PageState.FAQ && isAuthenticated
      ? "לעמוד הראשי"
      : "שאלות ותשובות";

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
            <Box>
              <Button
                sx={{ margin: 2 }}
                variant="outlined"
                onClick={() => setPage(isAuthenticated)}
              >
                {navButtonText}
              </Button>
              {isAuthenticated ? (
                <UserAccount onClick={handleProfileMenuOpen} />
              ) : null}
            </Box>
          </Box>

          {isAuthenticated ? (
            <Box sx={{ display: { xs: "flex", md: "none" } }}>
              <More onClick={handleMobileMenuOpen} />
            </Box>
          ) : null}
        </Toolbar>
      </AppBar>
      <MobileMenu
        isMenuOpen={!!mobileMoreAnchorEl}
        handleMenuOpen={handleMobileMenuOpen}
        handleMenuClose={handleMobileMenuClose}
        anchorEl={mobileMoreAnchorEl}
      />
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
