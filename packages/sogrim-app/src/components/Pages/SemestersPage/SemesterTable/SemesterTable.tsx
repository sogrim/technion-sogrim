import { useState, useEffect } from "react";
import { Box, Table, TableContainer, Button } from "@mui/material";
import { observer } from "mobx-react-lite";
import { RowData, UpdateUserDetailsAction } from "./SemesterTabsConsts";
import { Paper } from "@mui/material";
import { SemesterTableHeader } from "./SemesterTableHeader";
import { useStore } from "../../../../hooks/useStore";
import { useAuth } from "../../../../hooks/useAuth";
import useUpdateUserState from "../../../../hooks/apiHooks/useUpdateUserState";
import { SemesterTableBody } from "./SemesterTableBody";

export interface SemesterTableProps {
  semester: string;
}

const SemesterTableComp: React.FC<SemesterTableProps> = ({ semester }) => {
  const {
    dataStore: {
      userDetails,
      generateRows,
      updateCourseInUserDetails,
      deleteCourseInUserDetails,
      insertCourseInUserDetails,
    },
  } = useStore();

  const { userAuthToken } = useAuth();

  const { mutate } = useUpdateUserState(userAuthToken);

  const [tableRows, setTableRows] = useState<RowData[]>([]);
  const [addRowToggle, setAddRowToggle] = useState<boolean>(false);

  useEffect(() => {
    if (userDetails) {
      setTableRows(
        generateRows(semester, userDetails.degree_status.course_statuses)
      );
    }
  }, [userDetails, generateRows, semester]);

  const handleUpdateUserDetails = (
    action: UpdateUserDetailsAction,
    rowData: RowData,
    semester: string
  ) => {
    switch (action) {
      case UpdateUserDetailsAction.AfterEdit:
        updateCourseInUserDetails(rowData, semester);
        break;

      case UpdateUserDetailsAction.AfterAdd:
        insertCourseInUserDetails(rowData, semester);
        break;

      case UpdateUserDetailsAction.AfterDelete:
        deleteCourseInUserDetails(rowData, semester);
        break;
    }

    //mutate(newUserDetails);
    //   console.log("hi hi hi", data?.details.degree_status.course_statuses);
    //   const newnewrow = generateRows(
    //     semester,
    //     data?.details.degree_status.course_statuses
    //   );
    //   console.log("~~~~~~ NEW! ", newnewrow);
    //   setTableRows(newnewrow);
  };

  const handleRowToggle = () => {
    setAddRowToggle(!addRowToggle);
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <Paper sx={{ width: "100%", mb: 2 }}>
        <TableContainer sx={{ width: "1200px" }}>
          <Table aria-labelledby="tableTitle" size={"small"}>
            <SemesterTableHeader />
            <SemesterTableBody
              tableRows={tableRows}
              semester={semester}
              handleUpdateUserDetails={handleUpdateUserDetails}
              handleRowToggle={handleRowToggle}
              addRowToggle={addRowToggle}
            />
          </Table>
        </TableContainer>
      </Paper>
      {!addRowToggle && (
        <Button variant="outlined" onClick={handleRowToggle}>
          הוסף קורס חדש
        </Button>
      )}
    </Box>
  );
};

export const SemesterTable = observer(SemesterTableComp);
