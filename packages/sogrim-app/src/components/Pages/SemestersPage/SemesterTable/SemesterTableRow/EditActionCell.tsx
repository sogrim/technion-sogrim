import { TableCell, IconButton  } from "@mui/material";
import { RowData } from "../SemesterTabsConsts";
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

export interface EditActionCellProps {
    row: RowData;  
    handleSave: any;
    handleCancel: any;
}

const EditActionCellComp: React.FC<EditActionCellProps> = ({
    row,
    handleCancel,
    handleSave,
}) => {
    // TODO: types.

    return (    
            <TableCell align="center">
                <IconButton color="primary" aria-label="save-row" component="span" onClick={handleSave}>
                   <SaveOutlinedIcon />
                </IconButton>
                <IconButton color="primary" aria-label="cancel-row" component="span" onClick={handleCancel}>
                    <CancelOutlinedIcon />
                </IconButton>
            </TableCell>
    );       
}

export const EditActionCell = EditActionCellComp;