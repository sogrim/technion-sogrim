import { useState, useEffect } from "react";
import { Box, Table, TableContainer, Button } from "@mui/material";
import { observer } from "mobx-react-lite";
import { RowData, UpdateUserDetailsAction } from "../SemesterTabsConsts";
import { Paper } from "@mui/material";
import { SemesterTableHeader } from "./SemesterTableHeader";
import { useStore } from "../../../../hooks/useStore";
import { useAuth } from "../../../../hooks/useAuth";
import useUpdateUserState from "../../../../hooks/apiHooks/useUpdateUserState";
import { SemesterTableBody } from "./SemesterTableBody";
import { ErrorToast } from "../../../Toasts/ErrorToast";

export interface SemesterTableProps {
  semester: string;
}

const SemesterTableComp: React.FC<SemesterTableProps> = ({ semester }) => {
  const {
    dataStore: {
      userDetails,
      generateRowsForSemester: generateRows,
      updateCourseInUserDetails,
      deleteCourseInUserDetails,
      insertCourseInUserDetails,
    },
    uiStore: { errorMsg },
  } = useStore();

  const { userAuthToken } = useAuth();
  const { mutate, isError, error } = useUpdateUserState(userAuthToken);

  const [tableRows, setTableRows] = useState<RowData[]>([]);
  const [addRowToggle, setAddRowToggle] = useState<boolean>(false);

  useEffect(() => {
    if (isError) {
      if ((error as any).response.status === 401) {
        window.location.reload();
      }
    }
    if (userDetails) {
      setTableRows(
        generateRows(semester, userDetails.degree_status.course_statuses)
      );
    }
  }, [userDetails, generateRows, semester, isError, error]);

  const handleUpdateUserDetails = (
    action: UpdateUserDetailsAction,
    rowData: RowData,
    semester: string
  ) => {
    let newUserDetails;
    switch (action) {
      case UpdateUserDetailsAction.AfterEdit:
        newUserDetails = updateCourseInUserDetails(rowData, semester);
        break;

      case UpdateUserDetailsAction.AfterAdd:
        newUserDetails = insertCourseInUserDetails(rowData, semester);
        break;

      case UpdateUserDetailsAction.AfterDelete:
        newUserDetails = deleteCourseInUserDetails(rowData, semester);
        break;
    }
    mutate(newUserDetails);
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
      <Paper sx={{ width: "100%", mb: addRowToggle ? 10 : 2 }}>
        <TableContainer sx={{ width: "1300px" }}>
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
        <Button
          variant="outlined"
          sx={{ marginBottom: 10 }}
          onClick={handleRowToggle}
        >
          ???????? ???????? ??????
        </Button>
      )}
      <ErrorToast msg={errorMsg} />
    </Box>
  );
};

export const SemesterTable = observer(SemesterTableComp);
