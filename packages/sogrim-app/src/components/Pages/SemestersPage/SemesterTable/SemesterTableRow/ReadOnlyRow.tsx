import { TableCell } from "@mui/material";
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
  const { name, courseNumber, credit, grade, type, state } = row;

  return (
    <>
      <TableCell
        align="center"
        component="th"
        id={labelId}
        scope="row"
        padding="none"
        width={"250px"}
      >
        {name}
      </TableCell>
      <TableCell align="center" width={"150px"}>
        {courseNumber}
      </TableCell>
      <TableCell align="center" width={"80px"}>
        {credit}
      </TableCell>
      <TableCell align="center" width={"250px"}>
        {grade}
      </TableCell>
      <TableCell align="center" width={"170px"}>
        {type}
      </TableCell>
      <TableCell align="center" width={"170px"}>
        {state}
      </TableCell>
      <ReadOnlyActionCell
        row={row}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
    </>
  );
};

export const ReadOnlyRow = observer(ReadOnlyRowComp);
