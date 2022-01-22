import { Autocomplete, TextField } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { useMemo } from "react";
import { useStore } from "../../hooks/useStore";
import { SearchType, SearchOption } from "../../types/ui-types";

export interface SeatchFiledProps {
  searchLable: string;
  searchType: SearchType;
  onChangeValue: (newValue: SearchOption) => void;
}
export const SeatchFiled: React.FC<SeatchFiledProps> = ({
  searchType,
  searchLable,
  onChangeValue,
}) => {
  const {
    dataStore: { getSearchOptionByType },
  } = useStore();
  const searchOptions = useMemo(
    () => getSearchOptionByType(searchType),
    [searchType, getSearchOptionByType]
  );

  const handleChangeOption = (e: React.SyntheticEvent<Element, Event>) => {
    e.preventDefault();
    let dataIndex = e.currentTarget.getAttribute("data-option-index") ?? -1;
    dataIndex = +dataIndex;
    if (dataIndex >= 0) {
      onChangeValue(searchOptions[dataIndex]);
    }
  };
  return (
    <Search>
      <Autocomplete
        sx={{ minWidth: "400px" }}
        freeSolo
        id={searchLable}
        disableClearable
        onChange={(e) => handleChangeOption(e)}
        options={searchOptions.map((option) => option.name)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={searchLable}
            InputProps={{
              ...params.InputProps,
              type: "search",
            }}
          />
        )}
      />
    </Search>
  );
};
const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));
