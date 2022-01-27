import { Link, Theme, Tooltip, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import React, { useEffect, useState } from "react";
import chrome from "../../../assets/chrome.png";
import edge from "../../../assets/edge.png";
import firefox from "../../../assets/firefox.png";
import windows from "../../../assets/windows.png";
import useUpdateUserUgData from "../../../hooks/apiHooks/useUpdateUgData";
import { useAuth } from "../../../hooks/useAuth";
export interface ImportGilionProps {
  handleSkip: () => void;
  handleClose: () => void;
  handleError: (msg: string) => void;
}

export const ImportGilion: React.FC<ImportGilionProps> = ({
  handleSkip,
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
          <Typography>
            נכנסים למערכת student ומגישים בקשה לגיליון ציונים. לאחר שהבקשה
            אושרה, יש לפתוח את גיליון הציונים{" "}
            <span style={{ color: "red" }}>(ולא תעודת ציונים!)</span> בדפדפן,
            ולהעתיק באמצעות Ctrl-A+Ctrl-C את כל התוכן לתיבה מתחת.
            <br /> אם תרצו להזין את הקורסים שלכם ידנית, ניתן לדלג על שלב זה
            בעזרת הכפתור למטה.
          </Typography>
          <Typography sx={{ marginTop: 1 }}>
            מסתבכים?
            <ul>
              <li>ודאו שגליון הציונים שהוצאתם הוא בעברית.</li>
              <li>
                ודאו שאכן העתקתם את <b>כל</b> התוכן של גליון הציונים.
              </li>
              <li>
                אם אתם ב-
                <TextWithIcon
                  {...{ text: "Windows", src: windows, alt: "windows" }}
                />
                , בדפדפן{" "}
                <TextWithIcon
                  {...{ text: "Google Chrome", src: chrome, alt: "chrome" }}
                />
                , יתכן ש-Ctrl-A בPDF-ים לא יעבוד כמו שצריך. במקרה זה, נסו לפתוח
                את ה-PDF בעזרת{" "}
                <TextWithIcon
                  {...{ text: "Microsoft Edge", src: edge, alt: "edge" }}
                />
                .
              </li>
              <li>
                ודאו שאתם <b>לא</b> פותחים את ה-PDF של גליון הציונים בדפדפן{" "}
                <TextWithIcon
                  {...{ text: "Mozilla Firefox", src: firefox, alt: "firefox" }}
                />{" "}
                {"("}לצערנו הוא אינו נתמך כרגע{")"}.
              </li>
            </ul>
          </Typography>
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
        <Tooltip
          title={
            <Typography>
              דלגו על ייבוא גליון הציונים והזינו את הקורסים שלכם ידנית
            </Typography>
          }
        >
          <Button onClick={handleSkip}>דלג</Button>
        </Tooltip>
        <Button onClick={handleSend}>שלח</Button>
        <Button onClick={handleClose}>בטל</Button>
      </DialogActions>
    </>
  );
};

interface TextWithIconProps {
  text: string;
  src: string;
  alt: string;
}

const TextWithIcon: React.FC<TextWithIconProps> = ({ text, src, alt }) => {
  return (
    <>
      <span style={{ fontSize: "small" }}> {text} </span>
      <img
        src={src}
        alt={alt}
        width="18px"
        height="18px"
        style={{ marginBottom: -4 }}
      />
    </>
  );
};
