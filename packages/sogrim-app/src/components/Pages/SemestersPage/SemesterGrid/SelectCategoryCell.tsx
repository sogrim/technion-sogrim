import { Box, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { GridRenderCellParams } from "@mui/x-data-grid";
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

  const { id, api, field } = props;

  const handleChange = async (event: SelectChangeEvent) => {
    event.preventDefault();
    const value = event.target.value;
    setDisplayValue(value);
    api.setEditCellValue({ id, field, value }, event);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", pr: 2 }}>
      <Select
        value={displayValue}
        id="course-type"
        name="type"
        onChange={handleChange}
        variant="outlined"
        size="small"
        fullWidth
      >
        {banksNamesOptions.map((option) => (
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
