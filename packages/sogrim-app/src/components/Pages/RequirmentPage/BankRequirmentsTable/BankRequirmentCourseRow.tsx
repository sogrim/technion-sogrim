import { useState, useEffect } from "react";
import { Box, Typography, Tooltip, IconButton, Chip } from "@mui/material";
import DoNotTouchIcon from "@mui/icons-material/DoNotTouch";
import HelpIcon from "@mui/icons-material/Help";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../../hooks/useStore";
import { useAuth } from "../../../../hooks/useAuth";
import useUpdateUserState from "../../../../hooks/apiHooks/useUpdateUserState";
import { RowData } from "../../SemestersPage/SemesterTable/SemesterTabsConsts";

enum IgnoreIconState {
  DontShow = 0,
  ShowIgnoe = 1,
  ShowV = 2,
}

interface BankRequirmentCourseProps {
  course: RowData;
}

const BankRequirmentCourseRowComp: React.FC<BankRequirmentCourseProps> = ({
  course,
}) => {
  const [showIgnoreIcon, setShowIgnoreIcon] = useState<IgnoreIconState>(
    IgnoreIconState.DontShow
  );

  useEffect(() => {
    if (course.type === "חובה" && course.state === "לא רלוונטי") {
      setShowIgnoreIcon(IgnoreIconState.ShowV);
    } else if (course.type === "חובה" && course.state !== "לא רלוונטי") {
      setShowIgnoreIcon(IgnoreIconState.ShowIgnoe);
    }
  }, [course.state, course.type]);
  const {
    dataStore: { updateIrrelevantCourse },
  } = useStore();
  const { userAuthToken } = useAuth();
  const { mutate } = useUpdateUserState(userAuthToken);

  const decodeSemesterNumber = (semester: string) => {
    if (semester) {
      const name = semester.replace("_", " ");
      const splitName = name.split(" ");
      if (splitName[0] === "קיץ") {
        return "קיץ";
      }
      return splitName[1];
    }
    return 0;
  };

  const clickIgnoreThisCourse = (
    course: RowData,
    action: "לא רלוונטי" | "לא הושלם"
  ) => {
    const userDetails = updateIrrelevantCourse(course, action);
    mutate(userDetails);
    if (action === "לא רלוונטי") {
      setShowIgnoreIcon(IgnoreIconState.ShowV);
    } else if (action === "לא הושלם") {
      setShowIgnoreIcon(IgnoreIconState.ShowIgnoe);
    }
  };
  return (
    <Box
      sx={{
        marginTop: "2px",
        p: 1,
        borderRadius: 2,
        border: "1px solid #d1d1d1",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Box sx={{ display: "flex", gap: 1 }}>
        <Typography fontWeight={500}>{course.name} </Typography>
        <Chip
          label={`${course.credit} נק"ז`}
          sx={{ minWidth: "5px" }}
          variant="outlined"
          size="small"
        />
        {course.state !== "הושלם" && (
          <Chip
            label="לא בוצע"
            color="secondary"
            variant="outlined"
            size="small"
          />
        )}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography fontWeight={50}>
          סמסטר {decodeSemesterNumber(course.semester)}
        </Typography>
        {course.msg && (
          <Tooltip sx={{ fontSize: "14px" }} title={course.msg} arrow>
            <IconButton>
              <HelpIcon fontSize={"small"} sx={{ marginLeft: "-10px" }} />
            </IconButton>
          </Tooltip>
        )}
        {showIgnoreIcon === IgnoreIconState.ShowIgnoe ? (
          <Tooltip title="התעלם מקורס זה בחישוב" arrow>
            <IconButton
              onClick={() => clickIgnoreThisCourse(course, "לא רלוונטי")}
            >
              <DoNotTouchIcon fontSize={"small"} />
            </IconButton>
          </Tooltip>
        ) : (
          showIgnoreIcon === IgnoreIconState.ShowV && (
            <Tooltip title="בטל התעלמות מקורס זה" arrow>
              <IconButton
                onClick={() => clickIgnoreThisCourse(course, "לא הושלם")}
              >
                <CheckCircleIcon fontSize={"small"} />
              </IconButton>
            </Tooltip>
          )
        )}
      </Box>
    </Box>
  );
};

export const BankRequirmentCourseRow = observer(BankRequirmentCourseRowComp);
