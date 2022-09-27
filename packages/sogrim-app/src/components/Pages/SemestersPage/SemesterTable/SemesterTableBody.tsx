import { TableBody, TableRow } from "@mui/material";
import { useEffect, useState } from "react";
import { useStore } from "../../../../hooks/useStore";
import { EditableRow } from "./SemesterTableRow/EditableRow";
import { NewRow } from "./SemesterTableRow/NewRow";
import { ReadOnlyRow } from "./SemesterTableRow/ReadOnlyRow";
import {
  emptyRow,
  RowData,
  UpdateUserDetailsAction,
} from "../SemesterTabsConsts";
import { courseFromUserValidations } from "../CourseValidator";

interface SemesterTableBodyProps {
  tableRows: RowData[];
  handleUpdateUserDetails: (
    action: UpdateUserDetailsAction,
    rowData: RowData,
    semester: string
  ) => void;
  semester: string;
  addRowToggle: boolean;
  handleRowToggle: () => void;
}

export const SemesterTableBody: React.FC<SemesterTableBodyProps> = ({
  tableRows,
  handleUpdateUserDetails,
  semester,
  addRowToggle,
  handleRowToggle,
}) => {
  const {
    uiStore: { setErrorMsg },
  } = useStore();
  const [semesterRows, setSemesterRows] = useState<RowData[]>(tableRows);
  const [editableRowCourseNumber, setEditableRowCourseNumber] = useState<
    string | null
  >(null);
  const [editRow, setEditRow] = useState<RowData>(emptyRow);

  useEffect(() => {
    setSemesterRows(tableRows);
  }, [tableRows]);

  useEffect(() => {
    if (addRowToggle) {
      setEditableRowCourseNumber(null);
      setEditRow(emptyRow);
    }
  }, [addRowToggle]);

  const handleEditChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type?: string
  ) => {
    let fieldName, fieldValue;
    if (type) {
      fieldName = type;
      fieldValue = event.target.value;
    } else {
      event.preventDefault();
      fieldName = type ?? (event.target?.getAttribute("name") as keyof RowData);
      fieldValue = event.target.value;
    }
    let newRowData: RowData = { ...editRow };
    // @ts-ignore
    newRowData[fieldName] = fieldValue;
    setEditRow(newRowData);
  };

  const handleEditClick = (event: any, row: RowData) => {
    event.preventDefault();
    if (addRowToggle) {
      handleRowToggle();
    }
    setEditableRowCourseNumber(row.courseNumber);
    setEditRow({ ...row });
  };

  const handleSaveClick = (event: any) => {
    event.preventDefault();
    let validationsStatus = courseFromUserValidations(editRow, semesterRows);
    if (validationsStatus.error) {
      setEditRow(emptyRow);
      setEditableRowCourseNumber(null);
      setErrorMsg(validationsStatus.msg);
      return;
    }
    const idx = semesterRows.findIndex(
      (row) => row.courseNumber === editRow.courseNumber
    );
    const newSemesterRows = [...semesterRows];
    newSemesterRows[idx] = validationsStatus.newRowData;
    setSemesterRows(newSemesterRows);
    setEditableRowCourseNumber(null);
    handleUpdateUserDetails(
      UpdateUserDetailsAction.AfterEdit,
      validationsStatus.newRowData,
      semester
    );
  };

  const handleDeleteClick = (event: any, courseNumber: string) => {
    event.preventDefault();
    const idx = semesterRows.findIndex(
      (row) => row.courseNumber === courseNumber
    );
    const newSemesterRows = [...semesterRows];
    const rowToDelete = { ...emptyRow };
    rowToDelete.courseNumber = courseNumber;
    newSemesterRows.splice(idx, 1);
    setSemesterRows(newSemesterRows);
    handleUpdateUserDetails(
      UpdateUserDetailsAction.AfterDelete,
      rowToDelete,
      semester
    );
  };

  const handleCancelClick = () => {
    setEditableRowCourseNumber(null);
    setEditRow(emptyRow);
    if (addRowToggle) {
      handleRowToggle();
    }
  };

  const handleAddClick = (event: any) => {
    event.preventDefault();

    let validationsStatus = courseFromUserValidations(editRow, semesterRows);
    if (validationsStatus.error) {
      setEditRow(emptyRow);
      setEditableRowCourseNumber(null);
      setErrorMsg(validationsStatus.msg);
      return;
    }

    const newSemesterRows = [...semesterRows, validationsStatus.newRowData];
    setEditRow(emptyRow);
    setSemesterRows(newSemesterRows);
    handleUpdateUserDetails(
      UpdateUserDetailsAction.AfterAdd,
      validationsStatus.newRowData,
      semester
    );
  };

  const generateKey = (course: RowData, idx: number) =>
    course.courseNumber + course.semester + idx;

  return (
    <>
      <TableBody>
        {semesterRows.map((row, index) => {
          const labelId = `table-row-${index}`;
          return (
            <TableRow hover tabIndex={-1} key={generateKey(row, index)}>
              {editableRowCourseNumber === row.courseNumber ? (
                <EditableRow
                  labelId={labelId}
                  editRow={editRow}
                  handleSave={handleSaveClick}
                  handleEditChange={handleEditChange}
                  handleCancel={handleCancelClick}
                />
              ) : (
                <ReadOnlyRow
                  row={row}
                  labelId={labelId}
                  handleEdit={handleEditClick}
                  handleDelete={handleDeleteClick}
                />
              )}
            </TableRow>
          );
        })}

        {addRowToggle && (
          <TableRow>
            <NewRow
              labelId={"new-row"}
              newRow={editRow}
              handleAdd={handleAddClick}
              handleEditChange={handleEditChange}
              handleCancel={handleCancelClick}
            />
          </TableRow>
        )}
      </TableBody>
    </>
  );
};
