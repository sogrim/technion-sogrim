import { Chip } from "@mui/material";
import React from "react";

interface BankChipProps {
  progress: number;
}
export const BankChip: React.FC<BankChipProps> = ({ progress }) => {
  return (
    <>
      {progress >= 100 ? (
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
