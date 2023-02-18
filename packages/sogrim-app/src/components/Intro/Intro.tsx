import Box from "@mui/material/Box";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { Faculty } from "../../types/data-types";
import { IntroStepper } from "./IntroStepper";
import { IntroSteps } from "./IntroSteps/IntroSteps";

const IntroComp: React.FC = () => {
  const [activeStep, setActiveStep] = React.useState<number>(0);
  const [chosenFaculty, setChosenFaculty] = React.useState<Faculty>(
    Faculty.Unknown
  );

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Box
      sx={{
        marginTop: "20px",
        display: "flex",
        alignItems: "flex-start",
        gap: "70px",
      }}
    >
      <IntroStepper activeStep={activeStep} handleBack={handleBack} />
      <Box
        sx={{
          display: "flex",
        }}
      >
        <IntroSteps
          activeStep={activeStep}
          handleBack={handleBack}
          handleNext={handleNext}
          chosenFaculty={chosenFaculty}
          setChosenFaculty={setChosenFaculty}
        />
      </Box>
    </Box>
  );
};

export const Intro = observer(IntroComp);
