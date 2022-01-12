import { TableCell, IconButton  } from "@mui/material";
import { RowData } from "../SemesterTabsConsts";
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
//import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

export interface ReadOnlyActionCellProps {
    row: RowData;  
    handleEdit: any;
    handleDelete: any;
}

const ReadOnlyActionCellComp: React.FC<ReadOnlyActionCellProps> = ({
    row,
    handleEdit,
    handleDelete,
}) => {
    // TODO: types.

    return (    
            <TableCell align="center">
                <IconButton color="primary" aria-label="edit-row" component="span" onClick={(event: any) => handleEdit(event, row)}>
                   <ModeEditOutlineOutlinedIcon />
                </IconButton>
                <IconButton color="primary" aria-label="delete-row" component="span" onClick={(event: any) => handleDelete(event, row.courseNumber)}>
                    <DeleteOutlinedIcon />
                </IconButton>
            </TableCell>
    );       
}

export const ReadOnlyActionCell = ReadOnlyActionCellComp;