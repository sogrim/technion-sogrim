import { TableRow } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { CRUDRow } from "./CRUDRow";
import { ReadOnlyRow } from "./ReadOnlyRow";
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

    const [isCrudRowOn, setIsCrudRowOn] = useState<boolean>(false)

    return (
        <TableRow
            hover            
            role="checkbox"
            aria-checked={isItemSelected}
            tabIndex={-1}
            key={row.name}
            selected={isItemSelected}
            sx={{ width: '1200px'}}
        >                      
            { !isCrudRowOn ? <ReadOnlyRow row={row} labelId={labelId}/> :  <CRUDRow row={row} labelId={labelId}/>}
            <SemesterActionCell isCrudRowOn={isCrudRowOn} setIsCrudRowOn={setIsCrudRowOn} row={row} />
        </TableRow>
    )
}

export const SemesterTableRow = observer(SemesterTableRowComp);