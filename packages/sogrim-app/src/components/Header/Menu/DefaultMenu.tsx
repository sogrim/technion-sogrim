import { Menu, MenuItem } from "@mui/material";
import { useAuth } from "../../../hooks/useAuth";
import { observer } from "mobx-react-lite";
import { RemoveDetails, SignOut } from "../Actions/Actions";
import { useState } from "react";
import { FormModal } from "../../Commom/FormModal";
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

  const closeRemoveUserDetailsModal = () =>
    setIsRemoveUserDetailsModalOpen(false);

  const handleRemoveUserDetailsClick = () =>
    setIsRemoveUserDetailsModalOpen(true);

  return (
    <Menu
      anchorEl={anchorEl}
      id="remove-user-details"
      keepMounted
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>
        <RemoveDetails disableTooltip onClick={handleRemoveUserDetailsClick} />
        אפס משתמש
      </MenuItem>
      <MenuItem onClick={handleMenuClose}>
        <SignOut disableTooltip onClick={logout} />
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
