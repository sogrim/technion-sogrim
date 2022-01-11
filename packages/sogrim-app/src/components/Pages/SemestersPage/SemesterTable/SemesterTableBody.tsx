import { TableBody } from "@mui/material";
import { SemesterTableRow } from "./SemesterTableRow";
import { RowData } from "./SemesterTabsConsts";

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

    return (
        <TableBody>         
              {(tableRows)                
                .map((row, index) => {                  
                  const labelId = `enhanced-table-checkbox-${index}`;
                  console.log('row!!!', row);
                  return (
                      <SemesterTableRow row={row} labelId={labelId} handleSave={handleSave} semester={semester} key={index} />                   
                  )
                })}              
        </TableBody>
    );
}