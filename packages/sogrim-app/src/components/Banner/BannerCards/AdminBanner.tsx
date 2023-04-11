import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import useCatalogs from "../../../hooks/apiHooks/useCatalogs";
import { useParseCompute } from "../../../hooks/apiHooks/useParseCompute";
import { useAuth } from "../../../hooks/useAuth";
import { useStore } from "../../../hooks/useStore";
import {
  Catalog,
  ComputeDegreeStatusPayload,
  Faculty,
} from "../../../types/data-types";

const AdminBannerComp: React.FC = () => {
  const [catalogs, setCatalogs] = React.useState<Catalog[]>([] as Catalog[]);
  const [selectedCatalog, setSelectedCatalog] =
    React.useState<Catalog | null>();

  const [ugText, setUgText] = React.useState<string | null>();

  const [errorModalOpen, setErrorModalOpen] = React.useState(false);

  const openErrorModal = () => {
    setErrorModalOpen(true);
  };

  const closeErrorModal = () => {
    setErrorModalOpen(false);
  };

  const { userAuthToken } = useAuth();

  const {
    dataStore: { updateStoreDegreeStatus, updateStoreCatalog },
    uiStore: { endGameRefetch },
  } = useStore();

  const { data: catalogsData, isLoading: catalogsIsLoading } = useCatalogs(
    userAuthToken,
    Faculty[Faculty.Medicine]
  );

  const { mutate, isLoading } = useParseCompute(userAuthToken);

  const handleSubmit = () => {
    if (ugText && selectedCatalog?._id) {
      const payload: ComputeDegreeStatusPayload = {
        catalogId: selectedCatalog?._id,
        gradeSheetAsString: ugText,
      };

      mutate(payload, {
        onSuccess: (data) => {
          updateStoreDegreeStatus(data);
          updateStoreCatalog(
            catalogsData?.find(
              (catalog) => catalog._id.$oid === selectedCatalog?._id.$oid
            )!
          );
          endGameRefetch();
        },
        onError: (error) => {
          openErrorModal();
        },
      });
      setUgText("");
    }
  };

  const handleChangeTextField = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setUgText(e.target.value);
  };

  React.useEffect(() => {
    if (catalogsData && !catalogsIsLoading) {
      setCatalogs(catalogsData);
    }
  }, [catalogsData, catalogsIsLoading]);

  return (
    <>
      <Card sx={{ width: 375, maxHeight: 150 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 1,
            }}
          >
            <Typography
              sx={{ fontSize: 18 }}
              color="text.secondary"
              gutterBottom
            >
              חישוב סגירת תואר
            </Typography>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isLoading}
              size="small"
            >
              חשב
            </Button>
          </Box>

          <TextField
            select
            label="קטלוג לימודים"
            onChange={(e) =>
              setSelectedCatalog(
                catalogs.find((catalog) => catalog.name === e.target.value)
              )
            }
            sx={{ width: "100%", marginBottom: 1 }}
            size="small"
          >
            {catalogs.map((catalog) => (
              <MenuItem key={catalog._id.$oid} value={catalog.name}>
                {catalog.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="גיליון ציונים"
            name="gradeSheetAsString"
            multiline
            maxRows={1}
            sx={{ width: "100%", marginBottom: 0 }}
            size="small"
            onChange={handleChangeTextField}
            value={ugText}
          />
        </CardContent>
      </Card>
      <Dialog
        open={errorModalOpen}
        onClose={closeErrorModal}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          שגיאה בחישוב סגירת התואר
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            לא הצלחנו לעבד את גיליון הציונים. אנא נסו שנית
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeErrorModal} color="primary" autoFocus>
            המשך
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export const AdminBanner = observer(AdminBannerComp);
