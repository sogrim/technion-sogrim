import { Box, Button } from "@mui/material";
import { DataGrid, GridCellEditCommitParams, heIL } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import useUpdateUserState from "../../../../hooks/apiHooks/useUpdateUserState";
import { useAuth } from "../../../../hooks/useAuth";
import { useStore } from "../../../../hooks/useStore";
import { ErrorToast } from "../../../Toasts/ErrorToast";
import {
  emptyRow,
  RowData,
  UpdateUserDetailsAction,
} from "../SemesterTabsConsts";
import { AddNewRow } from "./AddNewRow";
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
    uiStore: { errorMsg, setErrorMsg, rowToDeleteId },
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

  useEffect(() => {
    if (rowToDeleteId !== "") {
      handleDelete(rowToDeleteId);
    }
  }, [rowToDeleteId]);

  const handleDelete = (rowToDeleteId: string) => {
    const idx = tableRows.findIndex(
      (row) => row.courseNumber === rowToDeleteId
    );
    if (idx === -1) {
      return;
    }
    const newSemesterRows = [...tableRows];
    const rowToDelete = { ...emptyRow };
    rowToDelete.courseNumber = rowToDeleteId;
    newSemesterRows.splice(idx, 1);
    setTableRows(newSemesterRows);
    handleUpdateUserDetails(
      UpdateUserDetailsAction.AfterDelete,
      rowToDelete,
      semester
    );
  };

  const handleAddClicked = (newRowInput: RowData) => {
    if (handleAdd(newRowInput)) {
      setAddRowToggle(!addRowToggle);
    }
  };

  const handleAdd = (newRowInput: RowData): boolean => {
    let validationsStatus = courseFromUserValidations(
      newRowInput,
      tableRows,
      true
    );
    if (validationsStatus.error) {
      setErrorMsg(validationsStatus.msg);
      return false;
    }

    const newSemesterRows = [...tableRows, validationsStatus.newRowData];

    setTableRows(newSemesterRows);
    handleUpdateUserDetails(
      UpdateUserDetailsAction.AfterAdd,
      validationsStatus.newRowData,
      semester
    );
    return true;
  };

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
          const oldRows = [...tableRows];
          oldRows[courseInTableIndex] = tableRows[courseInTableIndex];
          setTableRows(oldRows);
          setErrorMsg(validationsStatus.msg);
          return;
        }

        const newSemesterRows = [...tableRows];
        newSemesterRows[courseInTableIndex] = validationsStatus.newRowData;
        setTableRows(newSemesterRows);

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
      <Box sx={{ mb: 4 }}>
        <div style={{ width: 1100 }}>
          <DataGrid
            rows={tableRows}
            columns={columns}
            localeText={heIL.components.MuiDataGrid.defaultProps.localeText}
            getRowId={(row) => row.courseNumber}
            autoHeight
            onCellEditCommit={handleEditRowsModelChange}
            hideFooter
          />
        </div>
      </Box>
      <Box sx={{ marginBottom: 15 }}>
        {!addRowToggle ? (
          <Button
            variant="outlined"
            onClick={() => setAddRowToggle(!addRowToggle)}
          >
            הוסף קורס חדש
          </Button>
        ) : (
          <AddNewRow handleAddClicked={handleAddClicked} />
        )}
      </Box>
      <ErrorToast msg={errorMsg} />
    </Box>
  );
};

export const SemesterGrid = observer(SemesterGridComp);
