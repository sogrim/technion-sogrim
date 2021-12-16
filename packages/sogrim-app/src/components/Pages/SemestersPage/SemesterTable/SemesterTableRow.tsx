import { TableRow } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";

import { CRUDRow } from "./CRUDRow";
import { ReadOnlyRow } from "./ReadOnlyRow";
import { SemesterActionCell } from "./SemesterActionCell";
import { RowData } from "./SemesterTabsConsts";

export interface SemesterTableRowProps {
    row: RowData;
    labelId: string;
    handleSave(newRowData: RowData): void;

}

const SemesterTableRowComp: React.FC<SemesterTableRowProps> = ({
    row,    
    labelId,
    handleSave,
}) => {

    const [isCrudRowOn, setIsCrudRowOn] = useState<boolean>(false);

    const [displayRow, setDisplayRow] = useState<RowData>({...row})
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, cellId: string) => {
        e.preventDefault();
        let newDisplayRow = displayRow;

        switch (cellId) {
        case "course-name":
            newDisplayRow.name = e.target.value;
            break;

        case "course-number":
            newDisplayRow.courseNumber = +e.target.value;
            break;

        case "course-grade":
            newDisplayRow.grade = e.target.value;
            break;

        case "course-credit":
            newDisplayRow.credit = +e.target.value;
            break;

        case "course-type":
            newDisplayRow.type = e.target.value;
            break;

        case "course-state":
            newDisplayRow.state = e.target.value;
            break;
        }
        
        setDisplayRow(newDisplayRow);        
    }  

    return (
        <TableRow
            hover            
            role="checkbox"            
            tabIndex={-1}
            key={row.name}            
            sx={{ width: '1200px'}}
        >                      
            { !isCrudRowOn ? <ReadOnlyRow row={displayRow} labelId={labelId}/> :  
                                <CRUDRow row={displayRow} labelId={labelId} handleChange={handleChange} />}
            <SemesterActionCell isCrudRowOn={isCrudRowOn} setIsCrudRowOn={setIsCrudRowOn} 
                                row={displayRow} handleSave={handleSave} />
        </TableRow>
    )
}

export const SemesterTableRow = observer(SemesterTableRowComp);