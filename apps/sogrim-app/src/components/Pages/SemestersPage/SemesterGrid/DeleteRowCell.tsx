import { Box, IconButton } from "@mui/material";
import { GridRenderCellParams } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../../hooks/useStore";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

const DeleteRowCellComp = (props: GridRenderCellParams) => {
  const {
    uiStore: { setRowToDelete },
  } = useStore();

  const { id } = props;

  const handleClick = async (event: any) => {
    event.preventDefault();
    setRowToDelete(id.toString());
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", p: 1 }}>
      <IconButton
        color="primary"
        aria-label="delete-row"
        component="span"
        onClick={handleClick}
      >
        <DeleteOutlinedIcon />
      </IconButton>
    </Box>
  );
};

const DeleteRowCell = observer(DeleteRowCellComp);

export function renderDeleteCell(params: any) {
  return <DeleteRowCell {...params} />;
}
