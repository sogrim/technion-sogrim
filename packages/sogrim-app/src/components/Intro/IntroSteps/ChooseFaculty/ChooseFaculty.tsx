import { Box, Button, Typography } from "@mui/material";
import React from "react";
import { Faculty } from "../../../../types/data-types";
import { IntroStepCard } from "../IntroStepCard";
import { transalteFacultyName } from "./faculty-content";

const faculties: Faculty[] = Object.values(Faculty)
  .filter((value) => typeof value === "string")
  .filter((value) => value !== "Unknown")
  .map((value) => value as Faculty);

interface ChooseFacultyProps {
  handleNext: () => void;
  setChosenFaculty: React.Dispatch<React.SetStateAction<Faculty>>;
}

export const ChooseFaculty: React.FC<ChooseFacultyProps> = ({
  setChosenFaculty,
  handleNext,
}) => {
  const handleFacultyClick = (faculty: Faculty) => {
    handleNext();
    setChosenFaculty(faculty);
  };

  return (
    <IntroStepCard>
      <Box
        noValidate
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          m: "20px",
          gap: "5px",
          justifyContent: "start",
        }}
      >
        {faculties.map((faculty) => (
          <Button
            key={faculty}
            size="small"
            onClick={() => handleFacultyClick(faculty)}
            fullWidth={true}
            variant="text"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <Typography variant="h5" sx={{ textAlign: "right" }}>
              {transalteFacultyName.get(faculty)}
            </Typography>
          </Button>
        ))}
      </Box>
    </IntroStepCard>
  );
};
