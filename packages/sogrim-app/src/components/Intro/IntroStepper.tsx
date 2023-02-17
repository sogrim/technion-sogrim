import {
  Box,
  Button,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import React from "react";

const steps = [
  {
    label: "בחר קטלוג",
    description: `בחר קטלוג לימודים`,
  },
  {
    label: "יבא קורסים",
    description: "",
  },
  {
    label: "סגור את התואר!",
    description: ``,
  },
];

interface IntroStepperProps {
  activeStep: number;
  handleNext: () => void;
  handleBack: () => void;
}

export const IntroStepper: React.FC<IntroStepperProps> = ({
  activeStep,
  handleNext,
  handleBack,
}) => {
  return (
    <Stepper activeStep={activeStep} orientation="vertical">
      {steps.map((step, index) => (
        <Step key={step.label}>
          <StepLabel color="white">
            <Typography variant="h4">{step.label}</Typography>
          </StepLabel>
          <StepContent>
            <Typography color="white">{step.description}</Typography>
            <Box sx={{ mb: 2 }}>
              <Box>
                {index !== 0 ? (
                  <Button
                    variant="outlined"
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, ml: 1 }}
                  >
                    חזור
                  </Button>
                ) : null}
              </Box>
            </Box>
          </StepContent>
        </Step>
      ))}
    </Stepper>
  );
};
