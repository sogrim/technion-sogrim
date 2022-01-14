import { useState, useEffect } from "react";
import { TableBody } from "@mui/material";
import { emptyRow, RowData } from "./SemesterTabsConsts";
import { TableRow } from "@mui/material";
import { ReadOnlyRow } from "./SemesterTableRow/ReadOnlyRow";
import { EditableRow } from "./SemesterTableRow/EditableRow";
import { NewRow } from "./SemesterTableRow/NewRow";

// TODO - types!!!
interface SemesterTableBodyProps {
  tableRows: RowData[];
  handleSave: (newRowData: RowData, semester: string) => void;
  semester: string;
  addRowToggle: boolean;
  handleRowToggle: () => void;
}

export const SemesterTableBody: React.FC<SemesterTableBodyProps> = ({
  tableRows,
  handleSave,
  semester,
  addRowToggle,
  handleRowToggle,
}) => {
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
    // TODO: validations & all props.
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
    const idx = semesterRows.findIndex(
      (row) => row.courseNumber === editRow.courseNumber
    );
    const newSemesterRows = [...semesterRows];
    newSemesterRows[idx] = editRow;
    setSemesterRows(newSemesterRows);
    setEditableRowCourseNumber(null);
  };

  const handleDeleteClick = (event: any, courseNumber: string) => {
    event.preventDefault();
    const idx = semesterRows.findIndex(
      (row) => row.courseNumber === courseNumber
    );
    const newSemesterRows = [...semesterRows];
    newSemesterRows.splice(idx, 1);
    setSemesterRows(newSemesterRows);
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

    //TODO: validations

    const newSemesterRows = [...semesterRows, editRow];
    setEditRow(emptyRow);
    setSemesterRows(newSemesterRows);
  };

  return (
    <TableBody>
      {semesterRows.map((row, index) => {
        const labelId = `table-row-${index}`;
        return (
          <TableRow hover tabIndex={-1} key={row.courseNumber}>
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
  );
};
