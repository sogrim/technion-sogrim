import React from "react";
import { observer } from "mobx-react-lite";
import { SemesterTabs } from "./SemesterTabs";

interface SemestersTabProps {}

const SemestersPageComp: React.FC<SemestersTabProps> = () => {
  return <SemesterTabs />;
};

export const SemestersPage = observer(SemestersPageComp);
