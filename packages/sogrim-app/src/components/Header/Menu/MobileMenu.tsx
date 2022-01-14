import React from "react";
import { observer } from "mobx-react-lite";
import { Box, Menu, MenuItem } from "@mui/material";
import { SignOut, Settings } from "../Actions/Actions";
import { useAuth } from "../../../hooks/useAuth";

interface MobileMenuProps {
  isMenuOpen: boolean;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  handleMenuClose: () => void;
  anchorEl: HTMLElement | null;
}

const MobileMenuComp = ({
  isMenuOpen,
  handleMenuOpen,
  handleMenuClose,
  anchorEl,
}: MobileMenuProps) => {
  const { isAuthenticated, logout } = useAuth();

  return isAuthenticated ? (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      id="primary-search-account-menu-mobile"
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <Box sx={{ textAlign: "center" }}>
        <>
          <MenuItem onClick={handleMenuClose}>
            <Settings disableTooltip />
            הגדרות
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <SignOut disableTooltip onClick={logout} />
            התנתקות
          </MenuItem>
        </>
      </Box>
    </Menu>
  ) : null;
};

export const MobileMenu = observer(MobileMenuComp);
