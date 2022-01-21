import { Menu, MenuItem } from "@mui/material";
import { useAuth } from "../../../hooks/useAuth";
import { observer } from "mobx-react-lite";
import { Guids, SignOut } from "../Actions/Actions";

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
  const { logout } = useAuth();

  return (
    <Menu
      anchorEl={anchorEl}
      id="remove-user-details"
      keepMounted
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={() => console.log("help clicked")}>
        <Guids disableTooltip />
        מדריך ועזרה
      </MenuItem>
      <MenuItem onClick={logout}>
        <SignOut disableTooltip />
        התנתקות
      </MenuItem>
    </Menu>
  );
};

export const DefaultMenu = observer(DefaultMenuComp);
