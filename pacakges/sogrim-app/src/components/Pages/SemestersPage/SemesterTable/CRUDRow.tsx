import { TableCell, TextField  } from "@mui/material";
import { observer } from "mobx-react-lite";
import { RowData } from "./SemesterTabsConsts";

export interface CRUDRowProps {
    row: RowData;
    labelId: string;
}

const CRUDRowComp: React.FC<CRUDRowProps> = ({
    row,    
    labelId
}) => {
    return (
       <>
            <TableCell
                align='center'
                component="th"
                id={labelId}
                scope="row"
                padding="none"
                width={'250px'}
            >
                <TextField id="outlined-basic" label={row.name} variant="outlined" size="small"/>                
            </TableCell>
            <TableCell align="center" width={'200px'}>
                <TextField id="outlined-basic" label={row.courseNumber} variant="outlined" size="small"/>                                
            </TableCell>
            <TableCell align="center" width={'50px'}>
                <TextField id="outlined-basic" label={row.credit} variant="outlined" size="small"/>  
            </TableCell>
             <TableCell align="center" width={'50px'}>
                <TextField id="outlined-basic" label={row.grade} variant="outlined" size="small"/>  
            </TableCell>
             <TableCell align="center" width={'200px'}>
                <TextField select id="outlined-basic" label={row.type} variant="outlined" size="small" fullWidth/>  
            </TableCell>
             <TableCell align="center" width={'200px'}>
                <TextField select id="outlined-basic" label={row.state} variant="outlined" size="small" fullWidth/>  
            </TableCell>
        </>
    )
}

export const CRUDRow = observer(CRUDRowComp);