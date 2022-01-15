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
  catalog: null,
  modified: false,
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
  const { userAuthToken } = useAuth();
  const { mutate } = useUpdateUserState(userAuthToken);

  const handleSend = () => {
    mutate(emptyUserDetails);
    handleClose();
    window.location.reload();
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
