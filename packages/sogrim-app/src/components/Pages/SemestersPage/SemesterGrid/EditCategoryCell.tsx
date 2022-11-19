import { Box, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { GridRenderCellParams, useGridApiContext } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { useStore } from "../../../../hooks/useStore";

const SelectCategoryEditComp = (props: GridRenderCellParams) => {
  const {
    dataStore: { getUserBankNames },
  } = useStore();

  const [displayValue, setDisplayValue] = useState<string>(props.row.type);

  const banksNamesOptions = useMemo(
    () => getUserBankNames(),
    [getUserBankNames]
  );

  const { id, field } = props;
  const api = useGridApiContext();

  const handleChange = async (event: SelectChangeEvent) => {
    event.preventDefault();
    const value = event.target.value;
    setDisplayValue(value);
    api.current.setEditCellValue({ id, field, value }, event);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", p: 1 }}>
      <Select
        value={displayValue}
        id="course-type"
        name="type"
        onChange={handleChange}
        variant="outlined"
        size="small"
        fullWidth
        sx={{ width: "140px" }}
      >
        {banksNamesOptions?.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
};

const SelectCategoryEdit = observer(SelectCategoryEditComp);

export function renderCategoryEditInputCell(params: any) {
  return <SelectCategoryEdit {...params} />;
}
