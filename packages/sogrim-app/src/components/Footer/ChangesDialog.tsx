import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { versionChanges } from "./changes";

export interface ChangesDialogProps {
  open: boolean;
  setOpen: (_: boolean) => void;
}

export const ChangesDialog: React.FC<ChangesDialogProps> = ({
  open,
  setOpen,
}) => {
  const handleClose = () => {
    setOpen(false);
  };
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      scroll="paper"
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
    >
      <DialogTitle id="scroll-dialog-title">מה חדש?</DialogTitle>
      <DialogContent dividers={true}>
        <DialogContentText id="scroll-dialog-description" tabIndex={-1}>
          {versionChanges.map((item, idx) => (
            <div key={idx}>
              <Typography fontSize="medium" fontWeight="bold">
                {item.version}
              </Typography>
              {item.changes.map((change, idx) => (
                <Typography key={idx} fontSize="small">
                  • {change}
                </Typography>
              ))}
              <br />
            </div>
          ))}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose}>
          בטל
        </Button>
      </DialogActions>
    </Dialog>
  );
};
