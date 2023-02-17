import React from "react";
import chrome from "../../../../assets/chrome.png";
import edge from "../../../../assets/edge.png";

export const ErrorDuringImport = () => {
  return (
    <React.Fragment>
      (
      <>
        <span style={{ fontSize: "11.5px" }}>
          {
            "ייבוא גיליון הציונים כשל. האם העתקתם את כל גיליון הציונים (ולא תעודת ציונים!) , דרך אחד מהדפדפנים הנתמכים?"
          }
        </span>
        <img src={chrome} alt={"chrome"} width="15px" height="15px" />
        <img src={edge} alt={"edge"} width="15px" height="15px" />
      </>
      )
    </React.Fragment>
  );
};
