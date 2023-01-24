import {
  Autocomplete,
  AutocompleteInputChangeReason,
  CircularProgress,
  FilterOptionsState,
  TextField,
} from "@mui/material";
import React from "react";
import { Course } from "../../../../types/data-types";

export interface CourseAutocompleteProps {
  name: string;
  helperText: string;
  options: readonly Course[];
  option_map: (option: Course) => string;
  option_filter: (
    options: string[],
    state: FilterOptionsState<string>
  ) => string[];
  value: string;
  inputValue: string;
  onChange: (value: string, type?: string) => void;
  onInputChange: (
    event: React.ChangeEvent<{}>,
    value?: string,
    reason?: AutocompleteInputChangeReason
  ) => void;
  isLoading: boolean;
}

export const CourseAutocomplete: React.FC<CourseAutocompleteProps> = (
  props
) => {
  return (
    <Autocomplete
      sx={{ width: "250px" }}
      freeSolo
      disableClearable
      autoComplete
      includeInputInList
      options={props.options.map(props.option_map)}
      filterOptions={(options, state) => props.option_filter(options, state)}
      value={props.value}
      inputValue={props.inputValue}
      onChange={(_, value) =>
        value ? props.onChange(value, props.name) : null
      }
      onInputChange={(e, _, reason) =>
        props.onInputChange(e, props.name, reason)
      }
      renderInput={(params) => (
        <TextField
          {...params}
          name={props.name}
          variant="outlined"
          size="small"
          helperText={props.helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {props.isLoading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
};
