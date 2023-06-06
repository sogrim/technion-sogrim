import {
  Autocomplete,
  Box,
  Button,
  CardActions,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import useCatalogs from "../../../../hooks/apiHooks/useCatalogs";
import useUpdateUserCatalog from "../../../../hooks/apiHooks/useUpdateUserCatalog";
import { useAuth } from "../../../../hooks/useAuth";
import { Catalog, Faculty } from "../../../../types/data-types";
import { IntroStepCard } from "../IntroStepCard";
import { CatalogsLinks } from "./CatalogsLinks";

interface ChooseCatalogProps {
  handleNext: () => void;
  chosenFaculty: Faculty;
}

export const ChooseCatalog: React.FC<ChooseCatalogProps> = ({
  chosenFaculty,
  handleNext,
}) => {
  const [catalogs, setCatalogs] = React.useState<Catalog[]>([] as Catalog[]);

  const [selectedCatalog, setSelectedCatalog] =
    React.useState<Catalog | null>();

  const { userAuthToken } = useAuth();

  const { data, isLoading } = useCatalogs(
    userAuthToken,
    Faculty[chosenFaculty]
  );
  const { mutate, isSuccess } = useUpdateUserCatalog(userAuthToken);

  React.useEffect(() => {
    if (data && !isLoading) {
      const sortedCatalogs = data.sort((first, second) =>
        first.name > second.name ? 1 : -1
      );
      setCatalogs(sortedCatalogs);
    }
  }, [data, isLoading]);

  React.useEffect(() => {
    if (isSuccess) {
      handleNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const handleSend = () => {
    if (selectedCatalog?._id.$oid) {
      mutate(selectedCatalog?._id.$oid);
    } else {
      // TODO: handle error state - no chosen catalog.
    }
  };

  return (
    <IntroStepCard>
      <Typography>
        בחר את קטלוג הלימודים שלך מרשימת הקטלוגים. שים לב, שחישוב ״סגור את
        התואר״ מתבסס על הקטלוג אותו בחרת.
      </Typography>
      <Typography>
        קישורים לאתר לימודי הסמכה לעיון בקטלוגי הלימודים לפי שנים:
      </Typography>
      <CatalogsLinks />
      <Box
        noValidate
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          m: "20px",
        }}
      >
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
      </Box>

      <CardActions sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          size="large"
          onClick={handleSend}
          variant="contained"
          sx={{ mt: 1, msScrollLimitXMin: 1 }}
        >
          בחר קטלוג
        </Button>
      </CardActions>
    </IntroStepCard>
  );
};
