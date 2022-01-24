import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { CatalogPageActions } from "./CatalogPageActions";
import { CatalogPageStepper } from "./CatalogPageStepper/CatalogPageStepper";
import { SingleCatalogSearch } from "./SingleCatalogSearch";

interface CatalogPageProps {}

const CatalogPageComp: React.FC<CatalogPageProps> = () => {
  return (
    <div style={{ width: "80%", display: "flex" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 1,
          gap: 3,
          justifyContent: "center",
          textAlign: "center",
          alignContent: "center",
          alignItems: "center",
        }}
      >
        <SingleCatalogSearch />
        <CatalogPageActions />
        <CatalogPageStepper />
      </Box>
    </div>
  );
};

export const CatalogsPage = observer(CatalogPageComp);
