import { Alert, Snackbar, Button, Grid } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import useComputeEndGame from "../../hooks/apiHooks/useComputeEndGame";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";

const ModifiedToastComp = () => {
  const {
    dataStore: { modifiedStatus },
  } = useStore();

  const { userAuthToken } = useAuth();

  const { refetch } = useComputeEndGame(userAuthToken);

  const triggerComputeEndGame = () => refetch();

  return (
    <>
      {modifiedStatus ? (
        <Snackbar open={true} onClose={() => console.log("hdas")}>
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
