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
import { Catalog, Faculty } from "../../../types/data-types";
import useUpdateUserCatalog from "../../../hooks/apiHooks/useUpdateUserCatalog";
import { useStore } from "../../../hooks/useStore";
import { transalteFacultyName } from "../../Intro/IntroSteps/ChooseFaculty/faculty-content";
import { catalogsLinks } from "../../Intro/IntroSteps/ChooseCatalog/CatalogsLinks";

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

  const {
    dataStore: { userDetails },
  } = useStore();

  const { data: catalogsData, isLoading } = useCatalogs(
    userAuthToken,
    userDetails?.catalog?.faculty
  );
  const { mutate } = useUpdateUserCatalog(userAuthToken);

  React.useEffect(() => {
    if (catalogsData && !isLoading) {
      const sortedCatalogs = catalogsData.sort((first, second) =>
        first.name > second.name ? 1 : -1
      );
      setCatalogs(sortedCatalogs);
    }
  }, [catalogsData, isLoading]);

  const handleSend = () => {
    if (selectedCatalog?._id.$oid) {
      mutate(selectedCatalog?._id.$oid);
    } else {
      // TODO: handle error state - no chosen catalog.
    }
    handleClose();
  };

  const modalTitle = React.useMemo(() => {
    const faculty = userDetails?.catalog?.faculty as unknown;
    console.log(faculty as Faculty);

    const facultyName = transalteFacultyName.get(faculty as Faculty);
    return "בחר קטלוג - " + facultyName;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <DialogTitle>{modalTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          בחר את קטלוג הלימודים שלך מרשימת הקטלוגים. שים לב, שחישוב ״סגור את
          התואר״ מתבסס על הקטלוג אותו בחרת.
        </DialogContentText>
        <DialogContentText>
          קישורים לאתר לימודי הסמכה לעיון בקטלוגי הלימודים לפי שנים:
        </DialogContentText>
        <Box sx={{ display: "flex", justifyContent: "space-around" }}>
          {catalogsLinks.map((catalogs) => (
            <Link
              key={catalogs.year}
              color={(theme: Theme) => theme.palette.secondary.main}
              href={catalogs.link}
              underline="hover"
              target="_blank"
              rel="noopener"
            >
              {`${catalogs.year}`}
            </Link>
          ))}
        </Box>
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
