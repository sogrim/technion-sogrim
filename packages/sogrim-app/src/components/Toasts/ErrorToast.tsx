import { Alert, Snackbar } from "@mui/material";
import { observer } from "mobx-react-lite";

interface ErrorToastProps {
  msg: string;
  handleClose: any;
}
const ErrorToastComp: React.FC<ErrorToastProps> = ({ msg, handleClose }) => {
  return (
    <>
      <Snackbar
        autoHideDuration={10000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={msg !== ""}
      >
        <Alert
          icon={false}
          sx={{
            width: "100%",
          }}
          severity="error"
          onClose={handleClose}
        >
          {msg}
        </Alert>
      </Snackbar>
    </>
  );
};

//

export const ErrorToast = observer(ErrorToastComp);
