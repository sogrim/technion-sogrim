import { Box, Button } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import useUpdateUserState from "../../../hooks/apiHooks/useUpdateUserState";
import { useAuth } from "../../../hooks/useAuth";
import { useStore } from "../../../hooks/useStore";
import { SemesterOptions } from "../../../types/ui-types";
import { TabPanel } from "../../AppPages/TabPanel";
import LoadingEndGameSkeleton from "../../Common/LoadingEndGameSkeleton";
import { MAX_GRID_WIDTH } from "./SemesterGrid/semester-grid-interface";
import { SemesterGrid } from "./SemesterGrid/SemesterGrid";
import { SemesterOptionsButton } from "./SemesterOptionsButton";

const SemesterTabsComp = () => {
  const { userAuthToken } = useAuth();
  const { mutate, isError, error } = useUpdateUserState(userAuthToken);
  const {
    uiStore: {
      currentSemesterIdx,
      setCurrentSemester,
      endGameLoading,
      userRegistrationState,
      setErrorMsg,
    },
    dataStore: {
      userDetails,
      getAllUserSemesters,
      deleteSemesterInUserDetails,
    },
  } = useStore();

  const [allSemesters, setAllSemesters] = useState<string[]>(
    getAllUserSemesters(userDetails.degree_status.course_statuses)
  );

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
    setErrorMsg("");
    // TODO check
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDetails, getAllUserSemesters, userRegistrationState, isError, error]);

  const findLastNonSummerSemester = (): string | undefined => {
    return allSemesters!!
      .slice()
      .reverse()
      .find((semester) => !semester.includes("קיץ"));
  };

  const addNewSemester = (semesterType: SemesterOptions) => {
    if (!allSemesters || allSemesters.length === 0) {
      const newSemesterList = [];
      const newSemesterName =
        semesterType === SemesterOptions.Winter ? "חורף_1" : "אביב_1";
      newSemesterList.push(newSemesterName);
      setAllSemesters(newSemesterList);
      return;
    }

    let lastNonSummerSemester = findLastNonSummerSemester();
    let lastSemester = allSemesters.slice(-1)[0];
    const newSemesterList = [...allSemesters];

    if (lastSemester && lastNonSummerSemester) {
      const lastSemesterName = lastNonSummerSemester.replace("_", " ");
      const splitName = lastSemesterName.split(" ");

      let newSemesterName =
        semesterType === SemesterOptions.Summer
          ? "קיץ"
          : lastNonSummerSemester.includes("חורף")
          ? "אביב"
          : "חורף";

      newSemesterName += "_" + (+splitName[1] + 1);

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
    <Box sx={{ width: "80%", maxWidth: MAX_GRID_WIDTH }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          mb: 1,
          justifyContent:
            !allSemesters || allSemesters.length === 0
              ? "center"
              : "space-between",
        }}
      >
        <Box
          sx={{
            flexGrow: !allSemesters || allSemesters.length === 0 ? "none" : 1,
            ml: 2,
          }}
        >
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
        <Box
          sx={{
            ml: 10,
            alignSelf:
              !allSemesters || allSemesters.length === 0
                ? "center"
                : "flex-end",
          }}
        >
          <SemesterOptionsButton
            allSemesters={allSemesters}
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
