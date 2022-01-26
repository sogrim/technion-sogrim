import { Typography, Box, TextField } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { useStore } from "../../../../hooks/useStore";

const StepperP1Comp: React.FC = () => {
  const {
    dataStore: { currentCatalog, updateCatalogName, updateCatalogTotalCredit },
  } = useStore();

  const handleEditName = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    updateCatalogName(event.target.value);
  };

  const handleEditCredit = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    updateCatalogTotalCredit(event.target.value);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", m: 2 }}>
      <Typography variant="h4"> פרטים כללים </Typography>
      <Box
        sx={{
          m: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          justifyContent: "space-between",
        }}
      >
        <TextField
          sx={{ width: "400px" }}
          required
          name="name"
          id="outlined-id"
          label="שם הקטלוג"
          value={currentCatalog?.name}
          onChange={handleEditName}
        />
        <TextField
          sx={{ width: "250px" }}
          required
          name="total_credit"
          id="outlined-id"
          label="סך הנק״ז"
          value={currentCatalog?.total_credit}
          onChange={handleEditCredit}
          type="number"
        />
      </Box>
    </Box>
  );
};
export const StepperP1 = observer(StepperP1Comp);
