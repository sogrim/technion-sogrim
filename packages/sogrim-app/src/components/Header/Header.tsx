import { AppBar, Box, Button, Theme, Toolbar } from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";
import { PageState } from "../../types/ui-types";
import { ExportToCsv } from "../Common/ExportToCsv";
import { UserAccount } from "./Actions/Actions";
import { AppTitle } from "./AppTitle/AppTitle";
import { DefaultMenu } from "./Menu";
import { ToggleDarkMode } from "./ToggleDarkMode";

interface HeaderProps {}

const HeaderComp: React.FC<HeaderProps> = () => {
  const { isAuthenticated } = useAuth();

  const {
    uiStore: { currentPage, setPage },
  } = useStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const navButtonText =
    currentPage === PageState.FAQ && isAuthenticated
      ? "לעמוד הראשי"
      : "שאלות ותשובות";

  return (
    <>
      <AppBar position="fixed" sx={sxAppBar}>
        <Toolbar variant="dense">
          <AppTitle />
          <Box sx={{ flexGrow: 1 }} />
          <Box
            sx={{
              display: {
                md: "flex",
                alignItems: "center",
                margin: "80px",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ExportToCsv />
              <Button
                sx={{ margin: 1 }}
                variant="outlined"
                onClick={() => setPage(isAuthenticated)}
              >
                {navButtonText}
              </Button>
              <ToggleDarkMode />
              {isAuthenticated ? (
                <UserAccount onClick={handleProfileMenuOpen} />
              ) : null}
            </Box>
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
  bgcolor: (theme: Theme) => theme.palette.background.default,
  height: 80,
  display: "flex",
  justifyContent: "center",
};
