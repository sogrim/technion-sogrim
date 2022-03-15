import { Button, IconButton, Tooltip, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { CSVLink } from "react-csv";
import { useStore } from "../../hooks/useStore";
import { UserDetails } from "../../types/data-types";
import DownloadIcon from "@mui/icons-material/Download";

const exportDegreeStatusToCsv = (
  userDetails?: UserDetails
): Array<Array<string>> => {
  const courseList = userDetails?.degree_status?.course_statuses ?? [];
  let rows: Array<Array<string>> = [];
  rows.push(["מספר הקורס", "שם הקורס", "נקז", "ציון", "סוג", "סטטוס"]);
  let courseRows: Array<Array<string>> = [];
  courseList.forEach((courseStatus) => {
    courseRows.push([
      courseStatus.course._id,
      courseStatus.course.name,
      courseStatus.course.credit.toString(),
      courseStatus.grade!!,
      courseStatus.type ?? "",
      courseStatus.state,
    ]);
  });
  courseRows.sort((a: Array<string>, b: Array<string>) => {
    return a[4].localeCompare(b[4]);
  });
  rows = rows.concat(courseRows);
  rows.push(["מסלול:", userDetails?.catalog?.name ?? ""]);
  rows.push([
    "נקז שיש לבצע:",
    userDetails?.catalog?.total_credit.toString() ?? "",
  ]);
  rows.push([
    "נקז שבוצע:",
    userDetails?.degree_status?.total_credit.toString() ?? "",
  ]);
  userDetails?.degree_status?.overflow_msgs.forEach((msg) => {
    rows.push([msg, ""]);
  });
  return rows;
};

const ExportToCsvComp: React.FC = () => {
  const {
    dataStore: { userDetails },
  } = useStore();
  const [csvData, setCsvData] = useState<Array<Array<string>>>([]);
  const [readyToDownload, setReadyToDownload] = useState(false);
  const csvLink = useRef<
    CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }
  >(null);

  const handleClickExport = () => {
    const csvData = exportDegreeStatusToCsv(userDetails);
    setCsvData(csvData);
    setReadyToDownload(true);
  };

  const handleClickDownload = () => {
    csvLink?.current?.link.click();
    setReadyToDownload(false);
  };

  return (
    <>
      <CSVLink
        data={csvData}
        ref={csvLink}
        filename={"סטטוס-תואר.csv"}
        target="_blank"
      />
      {!!userDetails &&
        !!userDetails.degree_status &&
        userDetails.degree_status.course_statuses.length > 0 &&
        (readyToDownload ? (
          <IconButton sx={{ gap: 0.5 }} onClick={() => handleClickDownload()}>
            <Typography fontWeight="bold"> הורדה </Typography>
            <DownloadIcon />
          </IconButton>
        ) : (
          <Tooltip
            arrow
            title={
              <Typography>
                יצאו את נתוני התואר לקובץ אקסל, והורידו את הקובץ
              </Typography>
            }
          >
            <Button variant="outlined" onClick={() => handleClickExport()}>
              <Typography fontWeight="bold">ייצא נתונים </Typography>
            </Button>
          </Tooltip>
        ))}
    </>
  );
};

export const ExportToCsv = observer(ExportToCsvComp);
