import { Box, Button } from "@mui/material";
import { DataGrid, GridCellEditCommitParams, heIL } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import useUpdateUserState from "../../../../hooks/apiHooks/useUpdateUserState";
import { useAuth } from "../../../../hooks/useAuth";
import { useStore } from "../../../../hooks/useStore";
import { ErrorToast } from "../../../Toasts/ErrorToast";
import { courseFromUserValidations } from "../CourseValidator";
import { RowData, UpdateUserDetailsAction } from "../SemesterTabsConsts";
import { AddNewRow } from "./AddNewRow";
import { columns } from "./semester-grid-interface";
import { SemesterFooter } from "./SemesterFooter";

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
    uiStore: { errorMsg, setErrorMsg, rowToDeleteId, setRowToDelete },
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
        generateRowsForSemester(
          semester,
          userDetails.degree_status.course_statuses
        )
      );
    }
  }, [userDetails, generateRowsForSemester, semester, isError, error]);

  useEffect(() => {
    if (rowToDeleteId !== "") {
      handleDelete(rowToDeleteId);
    }
    // TODO check
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowToDeleteId]);

  const handleDelete = (rowToDeleteId: string) => {
    const idx = tableRows.findIndex(
      (row) => row.courseNumber === rowToDeleteId
    );
    if (idx === -1) {
      return;
    }
    const newSemesterRows = [...tableRows];
    const rowToDelete = { ...tableRows[idx] };
    newSemesterRows.splice(idx, 1);
    setTableRows(newSemesterRows);
    setRowToDelete("");
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

    let newRowData = validationsStatus.newRowData;
    let newDisplayRowData = {
      ...newRowData,
      type: newRowData.type ? newRowData.type : "-",
      grade: newRowData.grade ? newRowData.grade : "-",
    } as RowData;

    const newSemesterRows = [...tableRows, newDisplayRowData];
    setTableRows(newSemesterRows);
    handleUpdateUserDetails(
      UpdateUserDetailsAction.AfterAdd,
      newRowData,
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
      value = value === "-" ? undefined : value;
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

        let newRowData = validationsStatus.newRowData;
        let newDisplayRowData = {
          ...newRowData,
          type: newRowData.type ? newRowData.type : "-",
          grade: newRowData.grade ? newRowData.grade : "-",
        } as RowData;

        const newSemesterRows = [...tableRows];
        newSemesterRows[courseInTableIndex] = newDisplayRowData;
        setTableRows(newSemesterRows);

        handleUpdateUserDetails(
          UpdateUserDetailsAction.AfterEdit,
          newRowData,
          semester
        );
      }
    },
    [handleUpdateUserDetails, semester, setErrorMsg, tableRows]
  );
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: 1100,
        alignItems: "center",
      }}
    >
      <Box sx={{ mb: 4, marginLeft: 4, marginRight: 4, width: "100%" }}>
        <DataGrid
          rows={tableRows}
          columns={columns}
          localeText={heIL.components.MuiDataGrid.defaultProps.localeText}
          getRowId={(row) => row.courseNumber}
          autoHeight
          onCellEditCommit={handleEditRowsModelChange}
          components={{ Footer: () => <SemesterFooter rows={tableRows} /> }}
        />
      </Box>
      <Box sx={{ marginBottom: 10 }}>
        {!addRowToggle ? (
          <Button
            variant="outlined"
            onClick={() => setAddRowToggle(!addRowToggle)}
          >
            הוסף קורס חדש
          </Button>
        ) : (
          <AddNewRow
            handleAddClicked={handleAddClicked}
            setAddRowToggle={setAddRowToggle}
          />
        )}
      </Box>
      <ErrorToast msg={errorMsg} />
    </Box>
  );
};

export const SemesterGrid = observer(SemesterGridComp);
