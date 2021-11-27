import { TableRow, TableCell, Input, IconButton  } from "@mui/material";
import { observer } from "mobx-react-lite";
import { RowData } from "./SemesterTabsConsts";
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
export interface SemesterActionCellProps {
    row: RowData;  
    isCrudRowOn: boolean;
    setIsCrudRowOn: (newState: boolean) => void;
}

const SemesterActionCellComp: React.FC<SemesterActionCellProps> = ({
    row,
    isCrudRowOn,
    setIsCrudRowOn
}) => {

    const handleEditRowCLick = () => {
        setIsCrudRowOn(!isCrudRowOn);
        console.log('hi there')
    }

    return (    
            <TableCell align="center">
                <IconButton color="primary" aria-label="edit-row" component="span" onClick={handleEditRowCLick}>
                    {!isCrudRowOn ? <ModeEditOutlineOutlinedIcon /> : <SaveOutlinedIcon />}
                </IconButton>
                <IconButton color="primary" aria-label="delete-row" component="span">
                    <DeleteOutlinedIcon />
                </IconButton>
            </TableCell>
    );       
}

export const SemesterActionCell = observer(SemesterActionCellComp);