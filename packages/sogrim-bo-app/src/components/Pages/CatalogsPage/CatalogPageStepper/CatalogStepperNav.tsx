import React from "react";
import { CatalogStepperPhase } from "../../../../types/ui-types";
import { StepperP1 } from "./StepperP1";

interface CatalogStepperNavProps {
  stepperPhase: CatalogStepperPhase;
}
const CatalogStepperNavComp: React.FC<CatalogStepperNavProps> = ({
  stepperPhase,
}) => {
  switch (stepperPhase) {
    case CatalogStepperPhase.SteeperP1:
      return <StepperP1 />;
    case CatalogStepperPhase.SteeperP2:
      return <div> hi2</div>;
    case CatalogStepperPhase.SteeperP3:
      return <div> hi3</div>;
    case CatalogStepperPhase.SteeperP4:
      return <div> hi4</div>;
    case CatalogStepperPhase.SteeperP5:
      return <div> hi5</div>;
  }
};
export const CatalogStepperNav = CatalogStepperNavComp;
