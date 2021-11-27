import { TableRow, TableCell, Input  } from "@mui/material";
import { observer } from "mobx-react-lite";
import { CellInput } from "../../../Commom/CellInput";
import { SemesterActionCell } from "./SemesterActionCell";
import { RowData } from "./SemesterTabsConsts";

export interface SemesterTableRowProps {
    row: RowData;
    isItemSelected: boolean;
    labelId: string;
}

const SemesterTableRowComp: React.FC<SemesterTableRowProps> = ({
    row,
    isItemSelected,
    labelId
}) => {

    return (
        <TableRow
            hover
            onClick={(event) => console.log(event, row.name)}
            role="checkbox"
            aria-checked={isItemSelected}
            tabIndex={-1}
            key={row.name}
            selected={isItemSelected}
            sx={{ width: '1200px'}}
        >                      
            <TableCell
                align='center'
                component="th"
                id={labelId}
                scope="row"
                padding="none"
                width={'250px'}
            >
             <CellInput defaultValue={row.name} id="cell-input-course-name" />

            </TableCell>
            <TableCell align="center">
                <CellInput defaultValue={row.courseNumber} id="cell-input-course-number" />

            </TableCell>
            <TableCell align="center">{row.credit}</TableCell>
            <TableCell align="center">{row.grade}</TableCell>
            <TableCell align="center">{row.type}</TableCell>
            <TableCell align="center">{row.state}</TableCell>
            <SemesterActionCell row={row} />
        </TableRow>
    )
}

export const SemesterTableRow = observer(SemesterTableRowComp);