import {
  Box,
  IconButton,
  Link,
  Theme,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoTwoToneIcon from "@mui/icons-material/InfoTwoTone";
import React from "react";

import chrome from "../../../../assets/chrome.png";
import edge from "../../../../assets/edge.png";
import firefox from "../../../../assets/firefox.png";
import windows from "../../../../assets/windows.png";

export const HowToImport = () => {
  return (
    <React.Fragment>
      <Typography>
        נכנסים למערכת student ומגישים בקשה לגיליון ציונים. לאחר שהבקשה אושרה, יש
        לפתוח את גיליון הציונים{" "}
        <span style={{ color: "red" }}>(ולא תעודת ציונים!)</span> בדפדפן,
        ולהעתיק באמצעות Ctrl-A+Ctrl-C את כל התוכן לתיבה מתחת.
        <br /> אם תרצו להזין את הקורסים שלכם ידנית, ניתן לדלג על שלב זה בעזרת
        הכפתור למטה.
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography sx={{ marginTop: 1 }}>מסתבכים?</Typography>
        <Tooltip title={<BrowsersSupportContent />} placement="bottom" arrow>
          <IconButton>
            <InfoTwoToneIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Link
        color={(theme: Theme) => theme.palette.secondary.main}
        href="https://students.technion.ac.il/local/docsgenerator/"
        underline="hover"
        target="_blank"
        rel="noopener"
      >
        {"עבור למערכת הנפקת הבקשות עבור גיליון הציונים"}
      </Link>
    </React.Fragment>
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

export const BrowsersSupportContent = () => {
  return (
    <Typography component={"span"}>
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
    </Typography>
  );
};
