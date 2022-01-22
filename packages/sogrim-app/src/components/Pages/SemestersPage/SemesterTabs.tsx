import { useState, useEffect } from "react";
import { Box, Tab } from "@mui/material";
import Tabs, { tabsClasses } from "@mui/material/Tabs";
import { TabPanel } from "../../AppPages/TabPanel";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../hooks/useStore";
import { SemesterTable } from "./SemesterTable/SemesterTable";
import LoadingEndGameSkeleton from "../../Commom/LoadingEndGameSkeleton";
import { SemesterOptionsButton } from "./SemesterOptionsButton";
import { SemesterOptions } from "../../../types/ui-types";
import { useAuth } from "../../../hooks/useAuth";
import useUpdateUserState from "../../../hooks/apiHooks/useUpdateUserState";

const SemesterTabsComp = () => {
  const [allSemesters, setAllSemesters] = useState<string[] | null>(null);

  const { userAuthToken } = useAuth();
  const { mutate } = useUpdateUserState(userAuthToken);
  const {
    uiStore: {
      semesterTab: value,
      setSemesterTab,
      endGameLoading,
      userRegistrationState,
    },
    dataStore: {
      userDetails,
      getAllUserSemesters,
      deleteSemesterInUserDetails,
    },
  } = useStore();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setSemesterTab(newValue);
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
    let lastSemester = findLastNonSummerSemester();
    if (!lastSemester) {
      // TODO: add user funcunality for chosing אביב או חורף
      lastSemester = "אביב_0";
    }
    const LastSemesterName = lastSemester.replace("_", " ");
    const splitName = LastSemesterName.split(" ");
    const newSemesterList = [...allSemesters];
    let newSemesterName;
    if (lastSemester) {
      if (
        semesterType !== SemesterOptions.Summer &&
        lastSemester.includes("חורף")
      ) {
        newSemesterName = "אביב_" + (+splitName[1] + 1);
      } else if (
        semesterType !== SemesterOptions.Summer &&
        lastSemester.includes("אביב")
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
      const newUserDetails = deleteSemesterInUserDetails(allSemesters[value]);
      const idx = allSemesters.findIndex(
        (semester) => semester === allSemesters[value]
      );
      const newSemesterList = [...allSemesters];
      newSemesterList.splice(idx, 1);
      setAllSemesters(newSemesterList);
      setSemesterTab(0);
      mutate(newUserDetails);
    }
  };

  return (
    <Box
      sx={{
        minWidth: 1100,
        [`& .${tabsClasses.scrollButtons}`]: {
          "&.Mui-disabled": { opacity: 0.3 },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Tabs
          textColor="primary"
          indicatorColor="primary"
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons
          sx={{ maxWidth: "1050px" }}
        >
          {allSemesters?.map((semester, index) => (
            <Tab
              sx={{ fontSize: "30px" }}
              label={semesterNaming(semester)}
              key={index}
            />
          ))}
        </Tabs>
        <SemesterOptionsButton
          handleAddSemester={addNewSemester}
          handleDeleteSemester={deleteSemester}
        />
      </Box>
      {endGameLoading ? (
        <LoadingEndGameSkeleton />
      ) : (
        <>
          {allSemesters?.map((semester, index) => (
            <Box sx={{ display: "flex", justifyContent: "center" }} key={index}>
              <TabPanel value={value} index={index}>
                {userDetails?.degree_status?.course_statuses ? (
                  <SemesterTable semester={semester} />
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
