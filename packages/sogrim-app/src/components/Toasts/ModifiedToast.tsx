import { Alert, Snackbar, Button, Tooltip, Typography } from "@mui/material";
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
            <Tooltip
              title={
                <Typography>
                  {" "}
                  לאחר עריכת קורסים, המידע נשמר באופן אוטומטי - אך סטאטוס התואר
                  .אינו מעודכן. כאשר תסיימו לערוך, לחצו על סגור את התואר פעולה
                  זו מפעילה את החישוב אל מול הקטלוג שלכם, ומעדכנת את דף הדרישות
                  וסטאטוס התואר. למידע נוסף, עברו לשאלות ותשובות :)
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
