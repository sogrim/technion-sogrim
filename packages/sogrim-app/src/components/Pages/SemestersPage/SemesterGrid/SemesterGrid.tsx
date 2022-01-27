import { Box, Button } from "@mui/material";
import { DataGrid, GridCellEditCommitParams, heIL } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import useUpdateUserState from "../../../../hooks/apiHooks/useUpdateUserState";
import { useAuth } from "../../../../hooks/useAuth";
import { useStore } from "../../../../hooks/useStore";
import { ErrorToast } from "../../../Toasts/ErrorToast";
import { RowData, UpdateUserDetailsAction } from "../SemesterTabsConsts";
import { courseFromUserValidations } from "./course-validator";
import { columns } from "./semester-grid-interface";

const rowDataKeys = ["name", "grade", "credit", "type"];
export interface SemesterGridProps {
  semester: string;
}

const SemesterGridComp: React.FC<SemesterGridProps> = ({ semester }) => {
  const {
    dataStore: {
      userDetails,
      generateRowsForSemester,
      updateCourseInUserDetails,
      deleteCourseInUserDetails,
      insertCourseInUserDetails,
    },
    uiStore: { errorMsg, setErrorMsg },
  } = useStore();

  const { userAuthToken } = useAuth();
  const { mutate } = useUpdateUserState(userAuthToken);

  const [tableRows, setTableRows] = useState<RowData[]>([]);
  const [addRowToggle, setAddRowToggle] = useState<boolean>(false);

  useEffect(() => {
    if (userDetails) {
      setTableRows(
        generateRowsForSemester(
          semester,
          userDetails.degree_status.course_statuses
        )
      );
    }
  }, [userDetails, generateRowsForSemester, semester]);

  const handleUpdateUserDetails = useCallback(
    (action: UpdateUserDetailsAction, rowData: RowData, semester: string) => {
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
    },
    [
      deleteCourseInUserDetails,
      insertCourseInUserDetails,
      mutate,
      updateCourseInUserDetails,
    ]
  );

  const handleRowToggle = () => {
    setAddRowToggle(!addRowToggle);
  };

  const handleEditRowsModelChange = useCallback(
    ({ id, field, value }: GridCellEditCommitParams) => {
      const courseInTableIndex = tableRows.findIndex(
        (row) => row.courseNumber === id
      );
      if (courseInTableIndex > -1 && tableRows[courseInTableIndex]) {
        const newRow = { ...tableRows[courseInTableIndex] };
        if (!rowDataKeys.includes(field)) {
          return;
        }
        // @ts-ignore //TODO fix typing
        newRow[field] = value;
        let validationsStatus = courseFromUserValidations(newRow, tableRows);
        if (validationsStatus.error) {
          setErrorMsg(validationsStatus.msg);
          return;
        }

        handleUpdateUserDetails(
          UpdateUserDetailsAction.AfterEdit,
          validationsStatus.newRowData,
          semester
        );
      }
    },
    [handleUpdateUserDetails, semester, setErrorMsg, tableRows]
  );

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div style={{ height: 400, width: 920 }}>
        <DataGrid
          rows={tableRows}
          columns={columns}
          localeText={heIL.components.MuiDataGrid.defaultProps.localeText}
          getRowId={(row) => row.courseNumber}
          autoHeight
          onCellEditCommit={handleEditRowsModelChange}
        />
      </div>
      {!addRowToggle && (
        <Button
          variant="outlined"
          sx={{ marginBottom: 10 }}
          onClick={handleRowToggle}
        >
          הוסף קורס חדש
        </Button>
      )}
      <ErrorToast msg={errorMsg} />
    </Box>
  );
};

export const SemesterGrid = observer(SemesterGridComp);
