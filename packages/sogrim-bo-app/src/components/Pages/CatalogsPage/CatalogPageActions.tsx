import { Box, Button } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { useStore } from "../../../hooks/useStore";
import { CatalogPageMode } from "../../../types/ui-types";

const CatalogPageActionsComp: React.FC = () => {
  const {
    uiStore: { setCatalogPageMode },
  } = useStore();
  return (
    <Box
      sx={{
        display: "flex",
        gap: 3,
      }}
    >
      <Button
        size="large"
        variant="contained"
        onClick={() => setCatalogPageMode(CatalogPageMode.Update)}
      >
        צפה ועדכן בקטלוג
      </Button>
      <Button
        size="large"
        variant="contained"
        onClick={() => setCatalogPageMode(CatalogPageMode.AddNew)}
      >
        הוסף קטלוג חדש
      </Button>
    </Box>
  );
};

export const CatalogPageActions = observer(CatalogPageActionsComp);
