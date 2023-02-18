import Box from "@mui/material/Box";
import { observer } from "mobx-react-lite";
import * as React from "react";
import useUserState from "../../hooks/apiHooks/useUserState";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";
import { IntroStepper } from "./IntroStepper";
import { IntroSteps } from "./IntroSteps/IntroSteps";

const IntroComp: React.FC = () => {
  const [activeStep, setActiveStep] = React.useState<number>(0);
  const {
    uiStore: { computeUserRegistrationState },
  } = useStore();

  const { userAuthToken } = useAuth();
  const { data, isLoading, refetch } = useUserState(userAuthToken);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <>
      <Box
        sx={{
          marginTop: "20px",
          display: "flex",
          alignItems: "flex-start",
          gap: "70px",
        }}
      >
        <IntroStepper
          activeStep={activeStep}
          handleBack={handleBack}
          handleNext={handleNext}
        />
        <Box
          sx={{
            display: "flex",
          }}
        >
          <IntroSteps
            activeStep={activeStep}
            handleBack={handleBack}
            handleNext={handleNext}
          />
        </Box>
      </Box>
    </>
  );
};

export const Intro = observer(IntroComp);
