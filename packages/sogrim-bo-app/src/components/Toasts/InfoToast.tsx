import { Alert, Snackbar } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useStore } from "../../hooks/useStore";

const InfoToastComp: React.FC = () => {
  const {
    uiStore: { setInfoMsg, infoMsg },
  } = useStore();
  return (
    <>
      <Snackbar
        autoHideDuration={10000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={infoMsg !== ""}
      >
        <Alert
          icon={false}
          sx={{
            width: "100%",
          }}
          severity="info"
          onClose={() => setInfoMsg("")}
        >
          {infoMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

//

export const InfoToast = observer(InfoToastComp);
