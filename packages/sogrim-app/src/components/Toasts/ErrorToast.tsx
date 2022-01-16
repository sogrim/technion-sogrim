import { Alert, Snackbar } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useStore } from "../../hooks/useStore";

interface ErrorToastProps {
  msg: string;
}
const ErrorToastComp: React.FC<ErrorToastProps> = ({ msg }) => {
  const {
    uiStore: { setErrorMsg },
  } = useStore();
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
          onClose={() => setErrorMsg("")}
        >
          {msg}
        </Alert>
      </Snackbar>
    </>
  );
};

//

export const ErrorToast = observer(ErrorToastComp);
