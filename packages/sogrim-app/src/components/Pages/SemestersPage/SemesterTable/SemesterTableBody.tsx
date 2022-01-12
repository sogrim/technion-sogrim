import { useState, useEffect } from 'react';
import { TableBody } from "@mui/material";
import { RowData } from "./SemesterTabsConsts";
import { TableRow } from "@mui/material";
import { ReadOnlyRow } from "./SemesterTableRow/ReadOnlyRow";
import { EditableRow } from './SemesterTableRow/EditableRow';

// TODO - types!!!
interface SemesterTableBodyProps {
    tableRows: RowData[];
    handleSave: (newRowData: RowData, semester: string) => void;
    semester: string;    
}

export const SemesterTableBody: React.FC<SemesterTableBodyProps> = ({
    tableRows,
    handleSave,
    semester,
}) => {

    const [semesterRows, setSemesterRows] = useState<RowData[]>(tableRows);

    useEffect(() => {
        setSemesterRows(tableRows);
        console.log('im use efecting')
    }, [ tableRows ])
    
    const [editableRowCourseNumber, setEditableRowCourseNumber] = useState<string | null>(null);

    const [editRow, setEditRow] = useState<RowData>({
        courseNumber: '',
        name: '',
        grade: '',
        state: '',
        type: '',
        credit: 0,
    });

    const handleEditChange = (event: any) => {
        event.preventDefault();

        const fieldName = event.target.getAttribute("name") as keyof RowData;
        const fieldValue = event.target.value;
        
        let newRowData: RowData = { ...editRow };
        // TODO: validations & all props.
        newRowData.name = fieldValue;
        setEditRow(newRowData);
  };

    const handleEditClick = (event: any, row: RowData) => {
        event.preventDefault();
        setEditableRowCourseNumber(row.courseNumber);
        setEditRow({...row});
    }; 

    const handleSaveClick = (event: any) => {
        event.preventDefault();
        const idx = semesterRows.findIndex( row => row.courseNumber === editRow.courseNumber);
        const newSemesterRows = [...semesterRows];
        newSemesterRows[idx] = editRow;
        setSemesterRows(newSemesterRows);
        setEditableRowCourseNumber(null);    
        console.log(semesterRows) 
    }; 
 

    const handleDeleteClick = (event: any, courseNumber: string) => {
        event.preventDefault();
        const idx = semesterRows.findIndex( row => row.courseNumber === courseNumber);
        const newSemesterRows = [...semesterRows];
        newSemesterRows.splice(idx, 1);
        setSemesterRows(newSemesterRows);
    };

    const handleCancelClick = () => {
        setEditableRowCourseNumber(null);
    };
    
    return (
        <TableBody>         
                {
              (semesterRows)                
                .map((row, index) => {                  
                  const labelId = `enhanced-table-checkbox-${index}`;
                  return (
                    <TableRow
                    hover            
                    role="checkbox"            
                    tabIndex={-1}
                    key={row.name}            
                    sx={{ width: '1200px'}}
                    >
                        {
                            editableRowCourseNumber === row.courseNumber ?
                            <EditableRow labelId={labelId} editRow={editRow} handleSave={handleSaveClick}
                                         handleEditChange={handleEditChange} handleCancel={handleCancelClick} />
                            :
                            <ReadOnlyRow row={row} labelId={labelId} handleEdit={handleEditClick} handleDelete={handleDeleteClick}/>                       

                        }                     
                        
                    </TableRow>             
                  )
                })}              
        </TableBody>
    );
}