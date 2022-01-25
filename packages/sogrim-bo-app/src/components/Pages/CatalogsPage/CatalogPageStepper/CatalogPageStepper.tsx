import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { useStore } from "../../../../hooks/useStore";
import { CatalogStepperNav } from "./CatalogStepperNav";

const steps = ["פרטים כללים", "דרישות", "מעבר נקודות", "החלפות קורסים", "סיום"];

const CatalogPageStepperComp: React.FC = () => {
  const {
    dataStore: { currentCatalog },
  } = useStore();
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<{
    [k: number]: boolean;
  }>({});

  const totalSteps = () => {
    return steps.length;
  };

  const completedSteps = () => {
    return Object.keys(completed).length;
  };

  const isLastStep = () => {
    return activeStep === totalSteps() - 1;
  };

  const allStepsCompleted = () => {
    return completedSteps() === totalSteps();
  };

  const handleNext = () => {
    const newActiveStep =
      isLastStep() && !allStepsCompleted()
        ? steps.findIndex((step, i) => !(i in completed))
        : activeStep + 1;
    setActiveStep(newActiveStep);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStep = (step: number) => () => {
    setActiveStep(step);
  };

  const handleComplete = () => {
    const newCompleted = completed;
    newCompleted[activeStep] = true;
    setCompleted(newCompleted);
    handleNext();
  };

  return currentCatalog ? (
    <Box sx={{ width: "100%", m: 1 }}>
      <Stepper nonLinear activeStep={activeStep}>
        {steps.map((label, index) => (
          <Step key={label} completed={completed[index]}>
            <StepButton color="inherit" onClick={handleStep(index)}>
              <Typography
                sx={{ fontWeight: index === activeStep ? "bold" : "regular" }}
              >
                {" "}
                {label}
              </Typography>
            </StepButton>
          </Step>
        ))}
      </Stepper>
      <div>
        {allStepsCompleted() ? (
          <>
            <Typography sx={{ mt: 2, mb: 1 }}>
              סיימת את כל השלבים! הקטלוג הוזן בהצלחה
            </Typography>
          </>
        ) : (
          <>
            <CatalogStepperNav stepperPhase={activeStep + 1} />
            <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                חזור
              </Button>
              <Box sx={{ flex: "1 1 auto" }} />
              <Button onClick={handleComplete} sx={{ mr: 1 }}>
                שלב הבא
              </Button>
              {activeStep !== steps.length && completed[activeStep] && (
                <Typography variant="caption" sx={{ display: "inline-block" }}>
                  שלב {activeStep + 1} כבר הושלם
                </Typography>
              )}
            </Box>
          </>
        )}
      </div>
    </Box>
  ) : (
    <Typography> ראשית, יש לטעון קורס לצפייה/עריכה</Typography>
  );
};

export const CatalogPageStepper = observer(CatalogPageStepperComp);
