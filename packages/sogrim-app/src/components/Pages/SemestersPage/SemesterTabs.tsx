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

      if (semesterType !== SemesterOptions.Summer) {
        newSemesterName += "_" + (+splitName[1] + 1);
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
          justifyContent:
            !allSemesters || allSemesters.length === 0
              ? "center"
              : "space-between",
        }}
      >
        <Tabs
          textColor="primary"
          indicatorColor="primary"
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons={!!allSemesters && !!allSemesters.length}
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
          allSemesters={allSemesters}
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
