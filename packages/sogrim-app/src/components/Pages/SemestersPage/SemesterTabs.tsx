import { Box, Button } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import useUpdateUserState from "../../../hooks/apiHooks/useUpdateUserState";
import { useAuth } from "../../../hooks/useAuth";
import { useStore } from "../../../hooks/useStore";
import { SemesterOptions } from "../../../types/ui-types";
import { TabPanel } from "../../AppPages/TabPanel";
import LoadingEndGameSkeleton from "../../Commom/LoadingEndGameSkeleton";
import { SemesterGrid } from "./SemesterGrid/SemesterGrid";
import { SemesterOptionsButton } from "./SemesterOptionsButton";

const SemesterTabsComp = () => {
  const [allSemesters, setAllSemesters] = useState<string[] | null>(null);

  const { userAuthToken } = useAuth();
  const { mutate } = useUpdateUserState(userAuthToken);
  const {
    uiStore: {
      currentSemesterIdx,
      setCurrentSemester,
      endGameLoading,
      userRegistrationState,
    },
    dataStore: {
      userDetails,
      getAllUserSemesters,
      deleteSemesterInUserDetails,
    },
  } = useStore();

  const handleChangeSemester = (newSemesterTab: number) => {
    setCurrentSemester(newSemesterTab);
  };

  const semesterNaming = (semesterName: string): string => {
    const name = semesterName.replace("_", " ");
    const splitName = name.split(" ");
    if (splitName[0] === "קיץ") {
      return splitName[0];
    }
    return name;
  };

  useEffect(() => {
    if (userDetails) {
      setAllSemesters(
        getAllUserSemesters(userDetails.degree_status.course_statuses)
      );
    }
  }, [userDetails, getAllUserSemesters, userRegistrationState]);

  const findLastNonSummerSemester = (): string | undefined => {
    return allSemesters!!
      .slice()
      .reverse()
      .find((semester) => !semester.includes("קיץ"));
  };

  const addNewSemester = (semesterType: SemesterOptions) => {
    if (!allSemesters) {
      return;
    }
    let lastNonSummerSemester = findLastNonSummerSemester();
    let lastSemester = allSemesters.slice(-1)[0];
    if (!lastSemester) {
      // TODO: add user funcunality for chosing אביב או חורף
      lastSemester = "אביב_0";
    }
    const LastSemesterName = lastSemester.replace("_", " ");
    const splitName = LastSemesterName.split(" ");
    const newSemesterList = [...allSemesters];
    let newSemesterName;
    if (lastSemester && lastNonSummerSemester) {
      if (
        semesterType !== SemesterOptions.Summer &&
        lastNonSummerSemester.includes("חורף")
      ) {
        newSemesterName = "אביב_" + (+splitName[1] + 1);
      } else if (
        semesterType !== SemesterOptions.Summer &&
        lastNonSummerSemester.includes("אביב")
      ) {
        newSemesterName = "חורף_" + (+splitName[1] + 1);
      } else {
        newSemesterName = "קיץ_" + (+splitName[1] + 1);
      }
      newSemesterList.push(newSemesterName);
      setAllSemesters(newSemesterList);
    }
  };

  const deleteSemester = () => {
    if (allSemesters) {
      const newUserDetails = deleteSemesterInUserDetails(
        allSemesters[currentSemesterIdx]
      );
      const idx = allSemesters.findIndex(
        (semester) => semester === allSemesters[currentSemesterIdx]
      );
      const newSemesterList = [...allSemesters];
      newSemesterList.splice(idx, 1);
      setAllSemesters(newSemesterList);
      setCurrentSemester(0);
      mutate(newUserDetails);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          width: "1100px",
          mb: 1,
        }}
      >
        <Box sx={{ flexGrow: 1, ml: 4 }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {allSemesters?.map((semester, index) => (
              <Button
                variant={
                  index === currentSemesterIdx ? "contained" : "outlined"
                }
                sx={{ fontSize: "15px" }}
                key={index}
                onClick={() => handleChangeSemester(index)}
              >
                {semesterNaming(semester)}
              </Button>
            ))}
          </Box>
        </Box>
        <Box sx={{ alignSelf: "end" }}>
          <SemesterOptionsButton
            handleAddSemester={addNewSemester}
            handleDeleteSemester={deleteSemester}
          />
        </Box>
      </Box>
      {endGameLoading ? (
        <LoadingEndGameSkeleton />
      ) : (
        <>
          {allSemesters?.map((semester, index) => (
            <Box sx={{ display: "flex", justifyContent: "center" }} key={index}>
              <TabPanel value={currentSemesterIdx} index={index}>
                {userDetails?.degree_status?.course_statuses ? (
                  // <SemesterTable semester={semester} />
                  // eslint-disable-next-line react/jsx-no-undef
                  <SemesterGrid semester={semester} />
                ) : null}
              </TabPanel>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
};

export const SemesterTabs = observer(SemesterTabsComp);
