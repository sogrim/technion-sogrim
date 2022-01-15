import { Box, Typography, Tooltip, IconButton } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { RowData } from "../../SemestersPage/SemesterTable/SemesterTabsConsts";
import DoNotTouchIcon from "@mui/icons-material/DoNotTouch";
import HelpIcon from "@mui/icons-material/Help";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useStore } from "../../../../hooks/useStore";
import { useAuth } from "../../../../hooks/useAuth";
import useUpdateUserState from "../../../../hooks/apiHooks/useUpdateUserState";

interface BankRequirmentContentProps {
  bankCourses: RowData[];
}

const BankRequirmentContentComp: React.FC<BankRequirmentContentProps> = ({
  bankCourses,
}) => {
  const {
    dataStore: { updateIrrelevantCourse },
  } = useStore();
  const { userAuthToken } = useAuth();
  const { mutate } = useUpdateUserState(userAuthToken);

  const generateKey = (course: RowData) =>
    course.courseNumber + course.semester;

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
  };

  return (
    <div style={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {bankCourses.map((course) => (
          <Box
            key={generateKey(course)}
            sx={{
              marginTop: "2px",
              p: 1,
              borderRadius: 2,
              border: "1px solid #d1d1d1",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Typography fontWeight={500}>{course.name} </Typography>
            <Box sx={{ display: "flex" }}>
              <Typography fontWeight={50}>
                סמסטר {decodeSemesterNumber(course.semester)}
              </Typography>
              {course.msg && (
                <Tooltip title={course.msg} arrow>
                  <HelpIcon />
                </Tooltip>
              )}
              {course.type === "חובה" && course.state !== "לא רלוונטי" ? (
                <Tooltip title="התעלם מקורס זה בחישוב" arrow>
                  <IconButton
                    onClick={() => clickIgnoreThisCourse(course, "לא רלוונטי")}
                  >
                    <DoNotTouchIcon fontSize={"small"} />
                  </IconButton>
                </Tooltip>
              ) : (
                course.type === "חובה" &&
                course.state === "לא רלוונטי" && (
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
        ))}
      </Box>
    </div>
  );
};

export const BankRequirmentContent = observer(BankRequirmentContentComp);
