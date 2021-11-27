import { TableRow, TableCell, Input  } from "@mui/material";
import { observer } from "mobx-react-lite";
import { RowData } from "./SemesterTabsConsts";

export interface SemesterActionCellProps {
    row: RowData;  
}

const SemesterActionCellComp: React.FC<SemesterActionCellProps> = ({
    row,    
}) => {

    return (    
            <TableCell align="center">{row.courseNumber}</TableCell>
    );       
}

export const SemesterActionCell = observer(SemesterActionCellComp);