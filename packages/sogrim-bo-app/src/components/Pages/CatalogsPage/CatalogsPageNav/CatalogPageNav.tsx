import { observer } from "mobx-react-lite";
import React from "react";
import { CatalogPageMode } from "../../../../types/ui-types";
import { useStore } from "../../../../hooks/useStore";
import { CatalogPageStepper } from "../CatalogPageStepper/CatalogPageStepper";

const CatalogPageNavComp: React.FC = () => {
  const {
    uiStore: { catalogPageMode },
  } = useStore();

  switch (catalogPageMode) {
    case CatalogPageMode.Update:
      return <CatalogPageStepper />;
    case CatalogPageMode.AddNew:
      return <div> hi</div>;
  }
};
export const CatalogPageNav = observer(CatalogPageNavComp);
