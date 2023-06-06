import { observer } from "mobx-react-lite";
import * as React from "react";
import { Faculty } from "../../../types/data-types";
import { ChooseCatalog } from "./ChooseCatalog/ChooseCatalog";
import { ChooseFaculty } from "./ChooseFaculty/ChooseFaculty";
import { ImportGradeSheet } from "./ImportGradeSheet/ImportGradeSheet";
import { TriggerCompute } from "./TriggerCompute/TriggerCompute";

interface IntroStepProps {
  activeStep: number;
  handleNext: () => void;
  handleBack: () => void;
  chosenFaculty: Faculty;
  setChosenFaculty: React.Dispatch<React.SetStateAction<Faculty>>;
}

const IntroStepComp: React.FC<IntroStepProps> = ({
  activeStep,
  handleNext,
  chosenFaculty,
  setChosenFaculty,
}) => {
  switch (activeStep) {
    case 0:
      return (
        <ChooseFaculty
          handleNext={handleNext}
          setChosenFaculty={setChosenFaculty}
        />
      );
    case 1:
      return (
        <ChooseCatalog handleNext={handleNext} chosenFaculty={chosenFaculty} />
      );
    case 2:
      return <ImportGradeSheet handleNext={handleNext} />;
    case 3:
      return <TriggerCompute />;
  }
  return null;
};

export const IntroSteps = observer(IntroStepComp);
