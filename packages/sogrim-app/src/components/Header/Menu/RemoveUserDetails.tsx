import * as React from "react";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import { useAuth } from "../../../hooks/useAuth";
import useUpdateUserState from "../../../hooks/apiHooks/useUpdateUserState";
import { UserDetails } from "../../../types/data-types";

const emptyUserDetails: UserDetails = {
  catalog: undefined,
  modified: false,
  compute_in_progress: false,
  degree_status: {
    course_statuses: [],
    course_bank_requirements: [],
    overflow_msgs: [],
    total_credit: 0,
  },
};
export interface RemoveUserDetailsProps {
  handleClose: () => void;
}

export const RemoveUserDetails: React.FC<RemoveUserDetailsProps> = ({
  handleClose,
}) => {
  const { userAuthToken, logout } = useAuth();
  const { mutate } = useUpdateUserState(userAuthToken);

  const handleSend = () => {
    mutate(emptyUserDetails);
    handleClose();
    setTimeout(() => {
      logout();
    }, 300);
  };

  return (
    <>
      <DialogTitle>מחיקת פרטי משתמש</DialogTitle>
      <DialogContent>
        <DialogContentText>
          האם ברוצנך לאפס את פרטי המשתמש? לאחר אישור, העמוד יתרענן ותחזור לתהליך
          בחירת הקטלוג וטעינת הקורסים.
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleSend}>כן אני בטוח, מחק</Button>
        <Button onClick={handleClose}>בטל</Button>
      </DialogActions>
    </>
  );
};
