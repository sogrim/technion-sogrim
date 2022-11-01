import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { Box, Menu, MenuItem } from "@mui/material";
import { SignOut, RemoveDetails } from "../Actions/Actions";
import { useAuth } from "../../../hooks/useAuth";
import { FormModal } from "../../Common/FormModal";
import { RemoveUserDetails } from "./RemoveUserDetails";

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
  const [isRemoveUserDetailsModalOpen, setIsRemoveUserDetailsModalOpen] =
    useState<boolean>(false);
  const { logout } = useAuth();

  const closeRemoveUserDetailsModal = () =>
    setIsRemoveUserDetailsModalOpen(false);

  const handleRemoveUserDetailsClick = () =>
    setIsRemoveUserDetailsModalOpen(true);

  return (
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
            <RemoveDetails
              disableTooltip
              onClick={handleRemoveUserDetailsClick}
            />
            אפס משתמש
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <SignOut disableTooltip onClick={logout} />
            התנתקות
          </MenuItem>
        </>
      </Box>
      {isRemoveUserDetailsModalOpen && (
        <FormModal
          dialogContent={
            <RemoveUserDetails handleClose={closeRemoveUserDetailsModal} />
          }
          handleClose={closeRemoveUserDetailsModal}
          open={isRemoveUserDetailsModalOpen}
        />
      )}
    </Menu>
  );
};

export const MobileMenu = observer(MobileMenuComp);
