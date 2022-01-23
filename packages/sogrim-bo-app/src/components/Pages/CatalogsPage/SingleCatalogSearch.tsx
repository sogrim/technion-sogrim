import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import useCatalog from "../../../hooks/apiHooks/useCatalog";
import { useAuth } from "../../../hooks/useAuth";
import { useStore } from "../../../hooks/useStore";
import { ThinCatalog } from "../../../types/data-types";
import { SearchOption } from "../../../types/ui-types";
import { SearchFiled } from "../../Search/SearchField";

interface SingleCatalogSearchProps {}

const SingleCatalogSearchComp: React.FC<SingleCatalogSearchProps> = () => {
  const {
    dataStore: { catalogsIds },
    uiStore: { setCurrentCatalog, setErrorMsg },
  } = useStore();
  const [catalogId, setCatalogId] = useState<string>("");
  const [catalogOption, setCatalogOption] = useState<ThinCatalog>();
  const { isAuthenticated } = useAuth();

  const { refetch } = useCatalog(isAuthenticated, catalogId);

  const onChangeValue = (so: SearchOption) => {
    const newCatalogOption = catalogsIds.find((cid) => cid._id.$oid === so._id);
    setCatalogOption(newCatalogOption);
    setCatalogId(so._id);
  };

  const handleOnLoadCatalog = async () => {
    if (catalogId !== "") {
      const fullCatalog = await refetch();
      if (fullCatalog && fullCatalog?.data) {
        setCurrentCatalog(fullCatalog?.data);
        setErrorMsg("");
      }
    } else {
      setErrorMsg("לא נבחר קטלוג");
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 5, alignItems: "center" }}>
      <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 20 }}>חפש קטלוג</Typography>
          <Button variant="outlined" onClick={handleOnLoadCatalog}>
            טען קטלוג
          </Button>
        </Box>

        <SearchFiled
          searchLable={catalogOption?.name ?? "חפש קטלוג"}
          searchType={"catalog-name"}
          onChangeValue={onChangeValue}
        />
      </Box>
      <Card sx={{ minWidth: 350, minHeight: 130 }}>
        {catalogOption && catalogOption._id.$oid !== "" ? (
          <>
            <CardContent>
              <Typography sx={{ fontSize: 20 }}>
                {catalogOption.name}
              </Typography>
            </CardContent>
          </>
        ) : (
          <CardContent>
            <Typography sx={{ fontSize: 20 }}>לא נבחר קטלוג</Typography>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export const SingleCatalogSearch = observer(SingleCatalogSearchComp);
