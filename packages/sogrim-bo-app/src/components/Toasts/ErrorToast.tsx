import { Alert, Snackbar } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useStore } from "../../hooks/useStore";

const ErrorToastComp: React.FC = () => {
  const {
    uiStore: { setErrorMsg, errorMsg },
  } = useStore();
  return (
    <>
      <Snackbar
        autoHideDuration={10000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={errorMsg !== ""}
      >
        <Alert
          icon={false}
          sx={{
            width: "100%",
          }}
          severity="error"
          onClose={() => setErrorMsg("")}
        >
          {errorMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

//

export const ErrorToast = observer(ErrorToastComp);
