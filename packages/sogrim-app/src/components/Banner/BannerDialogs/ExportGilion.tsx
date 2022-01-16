import { Link, Theme } from "@mui/material";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import React, { useEffect, useState } from "react";
import useUpdateUserUgData from "../../../hooks/apiHooks/useUpdateUgData";
import { useAuth } from "../../../hooks/useAuth";
export interface ImportGilionProps {
  handleClose: () => void;
  handleError: (msg: string) => void;
}

export const ExportGilion: React.FC<ImportGilionProps> = ({
  handleClose,
  handleError,
}) => {
  const [ugText, setUgText] = useState<string | null>(null);
  const { userAuthToken } = useAuth();

  const { mutate, isError } = useUpdateUserUgData(userAuthToken);

  const handleChangeTextField = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setUgText(e.target.value);
  };
  const handleSend = () => {
    if (ugText) {
      mutate(ugText);
    }
    handleClose();
  };

  useEffect(() => {
    const errorMsg = isError
      ? "ייבוא גיליון הציונים כשל. האם העתקתם את כל גיליון הציונים (ולא תעודת ציונים!) , דרך דפדפן כרום?"
      : "";
    handleError(errorMsg);
  }, [handleError, isError]);

  return (
    <>
      <DialogTitle>יבא קורסים</DialogTitle>
      <DialogContent>
        <DialogContentText>
          נכנסים למערכת student ומגישים בקשה לגיליון ציונים. לאחר שהבקשה אושרה,
          יש לפתוח את גיליון הציונים (ולא תעודת ציונים!) בדפדפן כרום, ולהעתיק את
          כל התוכן לתיבה מתחת
        </DialogContentText>
        <Link
          color={(theme: Theme) => theme.palette.secondary.dark}
          href="https://students.technion.ac.il/local/docsgenerator/"
          underline="hover"
          target="_blank"
          rel="noopener"
        >
          {"עבור למערכת הנפקת הבקשות עבור גיליון הציונים"}
        </Link>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          id="outlined-multiline-static"
          label="העתק לכאן את גיליון הציונים"
          multiline
          rows={4}
          placeholder="הכנס לגיליון הציונים ב-student, והעתק את כולו לכאן."
          onChange={handleChangeTextField}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSend}>שלח</Button>
        <Button onClick={handleClose}>בטל</Button>
      </DialogActions>
    </>
  );
};
