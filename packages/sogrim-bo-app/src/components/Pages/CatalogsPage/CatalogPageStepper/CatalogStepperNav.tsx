import React from "react";
import { CatalogStepperPhase } from "../../../../types/ui-types";

interface CatalogStepperNavProps {
  stepperPhase: CatalogStepperPhase;
}
const CatalogStepperNavComp: React.FC<CatalogStepperNavProps> = ({
  stepperPhase,
}) => {
  console.log(CatalogStepperPhase.SteeperP1, stepperPhase);
  switch (stepperPhase) {
    case CatalogStepperPhase.SteeperP1:
      return <div> hi</div>;
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
