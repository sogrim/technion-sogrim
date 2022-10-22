import * as React from "react";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import {
  Autocomplete,
  Box,
  CircularProgress,
  FormControl,
  Link,
  TextField,
  Theme,
} from "@mui/material";
import useCatalogs from "../../../hooks/apiHooks/useCatalogs";
import { useAuth } from "../../../hooks/useAuth";
import { Catalog } from "../../../types/data-types";
import useUpdateUserCatalog from "../../../hooks/apiHooks/useUpdateUserCatalog";

export interface SelectCatalogProps {
  handleClose: () => void;
}

export const SelectCatalog: React.FC<SelectCatalogProps> = ({
  handleClose,
}) => {
  const [selectedCatalog, setSelectedCatalog] =
    React.useState<Catalog | null>();
  const [catalogs, setCatalogs] = React.useState<Catalog[]>([] as Catalog[]);

  const { userAuthToken } = useAuth();

  const { data, isLoading, isError, error } = useCatalogs(userAuthToken);
  const { mutate } = useUpdateUserCatalog(userAuthToken);

  React.useEffect(() => {
    if (isError) {
      // TODO: handle error
      if ((error as any).response.status === 401) {
        window.location.reload();
      }
    } else if (data && !isLoading) {
      const sortedCatalogs = data.sort((first, second) =>
        first.name <= second.name ? 1 : -1
      );
      setCatalogs(sortedCatalogs);
    }
  }, [data, isLoading, isError, error]);

  const handleSend = () => {
    if (selectedCatalog?._id.$oid) {
      mutate(selectedCatalog?._id.$oid);
    } else {
      // TODO: handle error state - no chosen catalog.
    }
    handleClose();
  };

  return (
    <>
      <DialogTitle>בחר קטלוג</DialogTitle>
      <DialogContent>
        <DialogContentText>
          בחר את קטלוג הלימודים שלך מרשימת הקטלוגים. שים לב, שחישוב ״סגור את
          התואר״ מתבסס על הקטלוג אותו בחרת.
        </DialogContentText>
        <Link
          color={(theme: Theme) => theme.palette.secondary.dark}
          href="http://www.cs.technion.ac.il/he/undergraduate/programs/catalogs/"
          underline="hover"
          target="_blank"
          rel="noopener"
        >
          {"עבור לאתר הפקולטה לעיון בקטלוג הלימודים"}
        </Link>
      </DialogContent>
      <Box
        noValidate
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          m: "auto",
        }}
      >
        <FormControl sx={{ minWidth: 375 }}>
          <Autocomplete
            onChange={(event: any, newValue: Catalog | null) => {
              setSelectedCatalog(newValue);
            }}
            disablePortal
            sx={{ overflowY: "visible" }}
            id="choose-catalog"
            options={catalogs}
            getOptionLabel={(option: Catalog) => option.name}
            renderInput={(params) => (
              <TextField
                {...params}
                label="בחר קטלוג"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {isLoading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
          />
        </FormControl>
      </Box>

      <DialogActions>
        <Button onClick={handleSend}>שלח</Button>
        <Button onClick={handleClose}>בטל</Button>
      </DialogActions>
    </>
  );
};
