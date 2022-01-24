import { observer } from "mobx-react-lite";
import React from "react";
import { CatalogPageMode } from "../../../../types/ui-types";
import { useStore } from "../../../../hooks/useStore";

const CatalogPageNavComp: React.FC = () => {
  const {
    uiStore: { catalogPageMode },
  } = useStore();

  switch (catalogPageMode) {
    case CatalogPageMode.Update:
      return <div> hi</div>;
    case CatalogPageMode.AddNew:
      return <div> hi</div>;
  }
};
export const CatalogPageNav = observer(CatalogPageNavComp);
