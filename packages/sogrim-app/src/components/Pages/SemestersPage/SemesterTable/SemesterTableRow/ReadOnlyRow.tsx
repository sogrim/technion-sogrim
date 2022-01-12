import { TableCell  } from "@mui/material";
import { observer } from "mobx-react-lite";
import { RowData } from "../SemesterTabsConsts";
import { ReadOnlyActionCell } from "./ReadOnlyActionCell";

export interface ReadOnlyRowProps {
    row: RowData;
    labelId: string;
    handleEdit: any;
    handleDelete: any;
}

const ReadOnlyRowComp: React.FC<ReadOnlyRowProps> = ({
    row,    
    labelId,
    handleEdit,
    handleDelete,
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
            <TableCell align="center" width={'150px'}>
                {row.courseNumber}
            </TableCell>
            <TableCell align="center" width={'50px'}>{row.credit}</TableCell>
            <TableCell align="center" width={'250px'}>{row.grade}</TableCell>
            <TableCell align="center" width={'170px'}>{row.type}</TableCell>
            <TableCell align="center" width={'170px'}>{row.state}</TableCell>
            <ReadOnlyActionCell row={row} handleEdit={handleEdit} handleDelete={handleDelete}/>
        </>
    )
}

export const ReadOnlyRow = observer(ReadOnlyRowComp);