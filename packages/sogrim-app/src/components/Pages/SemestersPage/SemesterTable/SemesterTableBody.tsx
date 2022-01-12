import { TableBody } from "@mui/material";
import { RowData } from "./SemesterTabsConsts";
import { TableRow } from "@mui/material";
import { ReadOnlyRow } from "./SemesterTableRow/ReadOnlyRow";

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


    const handleEdit = () => {
    }; 

    const handleDelete = () => {
    };

    const handleCancel = () => {
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
                        <ReadOnlyRow row={row} labelId={labelId} handleEdit={handleEdit} handleDelete={handleDelete}/>                       
                    </TableRow>             
                  )
                })}              
        </TableBody>
    );
}