import { Alert, Snackbar, Button } from "@mui/material";
import { observer } from "mobx-react-lite";
import useComputeEndGame from "../../hooks/apiHooks/useComputeEndGame";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";

const ModifiedToastComp = () => {
  const {
    dataStore: { modifiedStatus },
    uiStore: { endGameRefetch },
  } = useStore();

  const { userAuthToken } = useAuth();

  const { refetch } = useComputeEndGame(userAuthToken);

  const triggerComputeEndGame = () => {
    endGameRefetch();
    refetch();
  };

  return (
    <>
      {modifiedStatus ? (
        <Snackbar open={true}>
          <Alert
            icon={false}
            sx={{
              width: "100%",
            }}
            severity="info"
          >
            סטאטוס התואר שלך אינו מעודכן - עלייך להריץ שוב את חישוב סגירת התואר.
            <Button
              onClick={triggerComputeEndGame}
              sx={{ margin: "0px 5px 0px 5px" }}
              size="small"
              variant="outlined"
            >
              סגור את התואר!
            </Button>
            <Button
              disabled
              sx={{ margin: "0px 5px 0px 5px" }}
              size="small"
              variant="outlined"
            >
              למידע נוסף
            </Button>
          </Alert>
        </Snackbar>
      ) : null}
    </>
  );
};

//

export const ModifiedToast = observer(ModifiedToastComp);
