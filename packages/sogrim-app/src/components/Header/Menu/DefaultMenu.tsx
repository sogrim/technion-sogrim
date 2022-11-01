import { Menu, MenuItem } from "@mui/material";
import { useAuth } from "../../../hooks/useAuth";
import { observer } from "mobx-react-lite";
import { RemoveDetails, SignOut } from "../Actions/Actions";
import { useState } from "react";
import { FormModal } from "../../Common/FormModal";
import { RemoveUserDetails } from "./RemoveUserDetails";

interface DefaultMenuProps {
  isMenuOpen: boolean;
  handleMenuClose: () => void;
  anchorEl: HTMLElement | null;
}

const DefaultMenuComp = ({
  isMenuOpen,
  handleMenuClose,
  anchorEl,
}: DefaultMenuProps) => {
  const [isRemoveUserDetailsModalOpen, setIsRemoveUserDetailsModalOpen] =
    useState<boolean>(false);
  const { logout } = useAuth();

  const closeRemoveUserDetailsModal = () => {
    setIsRemoveUserDetailsModalOpen(false);
    handleMenuClose();
  };

  const handleRemoveUserDetailsClick = () => {
    setIsRemoveUserDetailsModalOpen(true);
    handleMenuClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      id="remove-user-details"
      keepMounted
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleRemoveUserDetailsClick}>
        <RemoveDetails disableTooltip />
        אפס משתמש
      </MenuItem>
      <MenuItem onClick={logout}>
        <SignOut disableTooltip />
        התנתקות
      </MenuItem>
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

export const DefaultMenu = observer(DefaultMenuComp);
