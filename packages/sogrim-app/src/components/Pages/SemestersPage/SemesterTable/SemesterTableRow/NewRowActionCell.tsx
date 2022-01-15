import { TableCell, IconButton } from "@mui/material";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

export interface NewRowActionCellProps {
  handleAdd: any;
  handleCancel: any;
}

const NewRowActionCellComp: React.FC<NewRowActionCellProps> = ({
  handleCancel,
  handleAdd,
}) => {
  // TODO: types.

  return (
    <TableCell align="center">
      <IconButton
        color="primary"
        aria-label="add-new-row"
        component="span"
        onClick={handleAdd}
      >
        <AddOutlinedIcon />
      </IconButton>
      <IconButton
        color="primary"
        aria-label="cancel-row"
        component="span"
        onClick={handleCancel}
      >
        <CancelOutlinedIcon />
      </IconButton>
    </TableCell>
  );
};

export const NewRowActionCell = NewRowActionCellComp;
