import { TableCell  } from "@mui/material";
import { observer } from "mobx-react-lite";
import { RowData } from "./SemesterTabsConsts";

export interface ReadOnlyRowProps {
    row: RowData;
    labelId: string;
}

const ReadOnlyRowComp: React.FC<ReadOnlyRowProps> = ({
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
                {row.name}
            </TableCell>
            <TableCell align="center" width={'200px'}>
                {row.courseNumber}
            </TableCell>
            <TableCell align="center" width={'50px'}>{row.credit}</TableCell>
            <TableCell align="center" width={'50px'}>{row.grade}</TableCell>
            <TableCell align="center" width={'200px'}>{row.type}</TableCell>
            <TableCell align="center" width={'200px'}>{row.state}</TableCell>
        </>
    )
}

export const ReadOnlyRow = observer(ReadOnlyRowComp);