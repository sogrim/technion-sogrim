import * as React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { FormModal } from "../Common/FormModal";
import { SelectCatalog } from "./BannerDialogs/SelectCatalog";
import { ImportGilion } from "./BannerDialogs/ImportGilion";
import { useStore } from "../../hooks/useStore";
import { useAuth } from "../../hooks/useAuth";
import useComputeEndGame from "../../hooks/apiHooks/useComputeEndGame";
import { observer } from "mobx-react-lite";
import useUserState from "../../hooks/apiHooks/useUserState";
import { CircularProgress } from "@mui/material";

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

const AppStepperComp: React.FC = () => {
  const [coursesModalOpen, setCoursesModalOpen] = React.useState(false);
  const [catalogsModalOpen, setCatalogsModalOpen] = React.useState(false);
  const [triggerCompute, setTriggerCompute] = React.useState(false);
  const [skipLoading, setSkipLoading] = React.useState(false);

  const [activeStep, setActiveStep] = React.useState<number>(0);
  const {
    uiStore: { computeUserRegistrationState },
  } = useStore();

  const { userAuthToken } = useAuth();
  const { data, isLoading, refetch } = useUserState(userAuthToken);
  const {
    data: tcData,
    isLoading: tcIsLoading,
    isError: tcIsError,
  } = useComputeEndGame(userAuthToken, triggerCompute);

  React.useEffect(() => {
    let unmounted = false;
    const refreshStepper = async () => {
      if (
        !unmounted &&
        data &&
        !isLoading &&
        (!coursesModalOpen || !catalogsModalOpen)
      ) {
        const { data: newData } = await refetch();
        if (newData) {
          const rs = computeUserRegistrationState(newData.details);
          setActiveStep(rs);
        }
      }
    };
    if (!unmounted) {
      refreshStepper();
    }
    return () => {
      unmounted = true;
    };
  }, [
    coursesModalOpen,
    catalogsModalOpen,
    data,
    setActiveStep,
    computeUserRegistrationState,
    refetch,
    isLoading,
  ]);

  React.useEffect(() => {
    let unmounted = false;

    if (!unmounted && tcIsError) {
      // TODO: error state
    } else if (!unmounted && tcData && !tcIsLoading) {
      setTriggerCompute(false);
    }
    return () => {
      unmounted = true;
    };
  }, [tcData, tcIsLoading, tcIsError]);

  const coursesHandleClickOpen = () => {
    setCoursesModalOpen(true);
  };

  const coursesHandleClose = () => {
    setCoursesModalOpen(false);
  };

  const coursesHandleSkip = () => {
    setCoursesModalOpen(false);
    setActiveStep(3);
    setTriggerCompute(true);
    setSkipLoading(true);
  };

  const catalogsHandleClickOpen = () => {
    setCatalogsModalOpen(true);
  };

  const catalogsHandleClose = () => {
    setCatalogsModalOpen(false);
  };

  const handleTriggerCompute = () => {
    setTriggerCompute(true);
  };

  const handleOnClick = async (index: number) => {
    if (index === 0) {
      catalogsHandleClickOpen();
    } else if (index === 1) {
      coursesHandleClickOpen();
    } else if (index === 2) {
      handleTriggerCompute();
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <>
      {!skipLoading ? (
        <Box sx={{ minWidth: 400, marginTop: "20px" }}>
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
                      <Button
                        variant="contained"
                        onClick={() => handleOnClick(index)}
                        sx={{ mt: 1, msScrollLimitXMin: 1 }}
                      >
                        {step.label}
                      </Button>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        sx={{ mt: 1, ml: 1 }}
                      >
                        חזור
                      </Button>
                    </Box>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
          <FormModal
            dialogContent={
              <ImportGilion
                handleSkip={coursesHandleSkip}
                handleClose={coursesHandleClose}
              />
            }
            handleClose={coursesHandleClose}
            open={coursesModalOpen}
          />
          <FormModal
            dialogContent={<SelectCatalog handleClose={catalogsHandleClose} />}
            handleClose={catalogsHandleClose}
            open={catalogsModalOpen}
          />
        </Box>
      ) : (
        <CircularProgress />
      )}
    </>
  );
};

export const AppStepper = observer(AppStepperComp);
