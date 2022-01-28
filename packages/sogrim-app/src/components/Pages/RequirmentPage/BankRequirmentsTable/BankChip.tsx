import { Chip } from "@mui/material";
import React from "react";

interface BankChipProps {
  completed: boolean;
}
export const BankChip: React.FC<BankChipProps> = ({ completed }) => {
  return (
    <>
      {completed ? (
        <Chip
          sx={{ ml: "8px" }}
          label="בוצע"
          color="success"
          variant="outlined"
          size="small"
        />
      ) : (
        <Chip
          sx={{ ml: "8px" }}
          label="בתהליך"
          color="info"
          variant="outlined"
          size="small"
        />
      )}
    </>
  );
};
