import {
  Link,
  Theme,
  Tooltip,
  Typography,
  Box,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import Button from "@mui/material/Button";
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
}

export const ImportGilion: React.FC<ImportGilionProps> = ({
  handleSkip,
  handleClose,
}) => {
  const [ugText, setUgText] = useState<string | null>(null);
  const [backdropOpen, setBackdropOpen] = useState(false);
  const { userAuthToken } = useAuth();

  const { mutate, isError, isLoading, isSuccess } =
    useUpdateUserUgData(userAuthToken);

  const handleChangeTextField = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setUgText(e.target.value);
  };
  const handleSend = () => {
    if (ugText) {
      setBackdropOpen(true);
      mutate(ugText);
    }
  };

  useEffect(() => {
    if (isError) {
      setBackdropOpen(false);
    }
  }, [isError]);

  useEffect(() => {
    if (isSuccess) {
      setBackdropOpen(false);
      handleClose();
    }
  }, [isSuccess]);

  return (
    <>
      <DialogTitle>יבא קורסים</DialogTitle>
      <DialogContent>
        <DialogContentText component={"span"}>
          <Typography>
            נכנסים למערכת student ומגישים בקשה לגיליון ציונים. לאחר שהבקשה
            אושרה, יש לפתוח את גיליון הציונים{" "}
            <span style={{ color: "red" }}>(ולא תעודת ציונים!)</span> בדפדפן,
            ולהעתיק באמצעות Ctrl-A+Ctrl-C את כל התוכן לתיבה מתחת.
            <br /> אם תרצו להזין את הקורסים שלכם ידנית, ניתן לדלג על שלב זה
            בעזרת הכפתור למטה.
          </Typography>
          <Typography sx={{ marginTop: 1 }}>מסתבכים?</Typography>
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
              , יתכן ש-Ctrl-A בPDF-ים לא יעבוד כמו שצריך. במקרה זה, נסו לפתוח את
              ה-PDF בעזרת{" "}
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
          error={isError}
          helperText={
            isError
              ? "ייבוא גיליון הציונים כשל. האם העתקתם את כל גיליון הציונים (ולא תעודת ציונים!) , דרך דפדפן כרום?"
              : ""
          }
          id="outlined-multiline-static"
          label="העתק לכאן את גיליון הציונים"
          multiline
          rows={4}
          placeholder="הכנס לגיליון הציונים ב-student, והעתק את כולו לכאן."
          onChange={handleChangeTextField}
        />
      </DialogContent>

      <Box sx={{ display: "flex", flexDirection: "right", m: 1, gap: 1 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Tooltip
            arrow
            title={
              <Typography>
                דלגו על ייבוא גליון הציונים והזינו את הקורסים שלכם ידנית
              </Typography>
            }
          >
            <Button variant="outlined" color="info" onClick={handleSkip}>
              דלג
            </Button>
          </Tooltip>
        </Box>
        <Button variant="outlined" onClick={handleSend}>
          שלח
        </Button>
        <Button variant="outlined" onClick={handleClose}>
          בטל
        </Button>
      </Box>
      {isLoading && (
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={backdropOpen}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
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
