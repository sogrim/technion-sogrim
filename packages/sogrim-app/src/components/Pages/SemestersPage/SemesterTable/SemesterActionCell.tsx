import { TableCell, IconButton  } from "@mui/material";
import { observer } from "mobx-react-lite";
import { RowData } from "./SemesterTabsConsts";
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
export interface SemesterActionCellProps {
    row: RowData;  
    isCrudRowOn: boolean;
    setIsCrudRowOn: (newState: boolean) => void;
    handleSave: (newRowData: RowData, semester: string) => void;
    semester: string;
}

const SemesterActionCellComp: React.FC<SemesterActionCellProps> = ({
    row,
    isCrudRowOn,
    setIsCrudRowOn,
    handleSave,
    semester,
}) => {

    const handleEditRowCLick = () => {
        if (isCrudRowOn) {
            handleSave(row, semester);
        }
        setIsCrudRowOn(!isCrudRowOn);        
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