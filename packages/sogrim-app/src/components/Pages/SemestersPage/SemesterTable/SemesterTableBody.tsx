import { useState } from 'react';
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
    
    const [editableRowCourseNumber, setEditableRowCourseNumber] = useState<string>('');

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

        // const fieldName = event.target.getAttribute("name");
        // const fieldValue = event.target.value;

        // const newFormData = { ...editFormData };
        // newFormData[fieldName] = fieldValue;

        // setEditFormData(newFormData);
  };


    const handleEditClick = (event: any, row: RowData) => {
        event.preventDefault();
        setEditableRowCourseNumber(row.courseNumber);
        setEditRow({...row});
    }; 
 

    const handleDeleteClick = () => {
    };

    const handleCancelClick = () => {
    };

    return (
        <TableBody>         
              {(tableRows)                
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
                            <EditableRow labelId={labelId} editRow={editRow} handleEdit={handleEditChange} handleCancel={handleCancelClick} />
                            :
                            <ReadOnlyRow row={row} labelId={labelId} handleEdit={handleEditClick} handleDelete={handleDeleteClick}/>                       

                        }                     
                        
                    </TableRow>             
                  )
                })}              
        </TableBody>
    );
}