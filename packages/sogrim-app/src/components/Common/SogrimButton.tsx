import { Button, ButtonProps, Theme, styled } from "@mui/material";
import { purple } from "@mui/material/colors";

export interface SogrimButtonProps {
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export const SogrimButton: React.FC<SogrimButtonProps> = ({
  children,
  onClick,
}) => {
  return (
    <ColorButton onClick={onClick} variant="contained">
      {children}
    </ColorButton>
  );
};

const ColorButton = styled(Button)<ButtonProps>(
  ({ theme }: { theme: Theme }) => ({
    color: theme.palette.getContrastText(purple[500]),
    fontSize: "18px",
    borderRadius: "15px",
    minWidth: "125px",
    backgroundColor: theme.palette.secondary.main,
    "&:hover": {
      backgroundColor: theme.palette.secondary.dark,
    },
  })
);
