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
        נכנסים למערכת SAP ולוחצים על "בקשות שלי והפקת תדפיסים ואישורים". לאחר
        מכן לוחצים על "צור בקשה". בוחרים "בקשות לאישורים ותדפיס ציונים", ממלאים
        את הפרטים בהתאם למסלול הלימודים שלכם ולוחצים "הגש". <br />
        פותחים את גיליון הציונים באמצעות דפדפן Edge או Chrome, ומעתיקים באמצעות
        Ctrl-A+Ctrl-C את כל התוכן של הגיליון.
        <br />
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography sx={{ marginTop: 1 }}>מסתבכים?</Typography>
        <Tooltip title={<BrowsersSupportContent />} placement="bottom" arrow>
          <IconButton>
            <InfoTwoToneIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Typography>
        <br /> אם תרצו להזין את הקורסים שלכם ידנית, ניתן לדלג על שלב זה.
      </Typography>
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
