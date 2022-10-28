import { Alert, Snackbar, Button, Tooltip, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import useComputeEndGame from "../../hooks/apiHooks/useComputeEndGame";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";

const ModifiedToastComp = () => {
  const {
    dataStore: { modifiedStatus },
    uiStore: { endGameRefetch },
  } = useStore();

  const { userAuthToken } = useAuth();

  const { refetch, isError, error } = useComputeEndGame(userAuthToken);

  const triggerComputeEndGame = () => {
    endGameRefetch();
    refetch();
  };

  useEffect(() => {
    if (isError) {
      if ((error as any).response.status === 401) {
        window.location.reload();
      }
    }
  }, [isError, error]);

  return (
    <>
      {modifiedStatus ? (
        <Snackbar
          sx={{ mt: "-12px" }}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          open={true}
        >
          <Alert
            icon={false}
            sx={{
              width: "100%",
            }}
            severity="info"
          >
            סטטוס התואר שלך אינו מעודכן - עלייך להריץ שוב את חישוב סגירת התואר.
            <Button
              onClick={triggerComputeEndGame}
              sx={{ margin: "0px 5px 0px 5px", fontWeight: "bold" }}
              size="small"
              variant="outlined"
            >
              סגור את התואר!
            </Button>
            <Tooltip
              arrow
              title={
                <Typography>
                  לאחר עריכת קורסים, המידע שלכם נשמר - אך סטטוס התואר אינו
                  מתעדכן.
                  <br />
                  כאשר תסיימו לערוך ולעדכן את הקורסים שלכם, לחצו על{" "}
                  <b>סגור את התואר</b> ואנו נפעיל את חישוב סגירת התואר בהתאם
                  לקטלוג שבחרתם :)
                </Typography>
              }
            >
              <Button
                sx={{ margin: "0px 5px 0px 5px" }}
                size="small"
                variant="outlined"
              >
                למידע נוסף
              </Button>
            </Tooltip>
          </Alert>
        </Snackbar>
      ) : null}
    </>
  );
};

//

export const ModifiedToast = observer(ModifiedToastComp);
