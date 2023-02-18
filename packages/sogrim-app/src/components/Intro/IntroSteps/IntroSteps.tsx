import { observer } from "mobx-react-lite";
import * as React from "react";
import { ChooseFaculty } from "./ChooseCatalog/ChooseCatalog";
import { ImportGradeSheet } from "./ImportGradeSheet/ImportGradeSheet";
import { TriggerCompute } from "./TriggerCompute/TriggerCompute";

interface IntroStepProps {
  activeStep: number;
  handleNext: () => void;
  handleBack: () => void;
}

const IntroStepComp: React.FC<IntroStepProps> = ({
  activeStep,
  handleNext,
  handleBack,
}) => {
  switch (activeStep) {
    case 0:
      return <ChooseFaculty handleNext={handleNext} handleBack={handleBack} />;
    case 1:
      return (
        <ImportGradeSheet handleNext={handleNext} handleBack={handleBack} />
      );
    case 2:
      return <TriggerCompute handleBack={handleBack} />;
  }
  return null;
};

export const IntroSteps = observer(IntroStepComp);
