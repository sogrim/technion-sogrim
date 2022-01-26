import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useStore } from "../../hooks/useStore";
import { SearchType, SearchOption } from "../../types/ui-types";

export interface SearchFiledProps {
  searchLable: string;
  searchType: SearchType;
  onChangeValue: (newValue: SearchOption) => void;
}
const SearchFiledComp: React.FC<SearchFiledProps> = ({
  searchType,
  searchLable,
  onChangeValue,
}) => {
  const {
    dataStore: {
      getSearchOptionByType,
      coursesMutate,
      courses,
      catalogsIds,
      currentCatalog,
    },
  } = useStore();

  const searchOptions = useMemo(() => {
    if (!coursesMutate) {
      return getSearchOptionByType(searchType);
    }
    return null;
  }, [
    searchType,
    getSearchOptionByType,
    coursesMutate,
    catalogsIds,
    courses,
    currentCatalog,
  ]);

  const handleChangeOption = (e: React.SyntheticEvent<Element, Event>) => {
    e.preventDefault();
    let dataIndex = e.currentTarget.getAttribute("data-option-index") ?? -1;
    dataIndex = +dataIndex;
    if (dataIndex >= 0 && searchOptions) {
      onChangeValue(searchOptions[dataIndex]);
    }
  };

  return searchOptions ? (
    <Autocomplete
      sx={{ minWidth: "400px" }}
      freeSolo
      id={searchLable}
      disableClearable
      onChange={(e) => handleChangeOption(e)}
      options={searchOptions?.map((option) => option.name)}
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
  ) : (
    <CircularProgress />
  );
};

export const SearchFiled = observer(SearchFiledComp);
