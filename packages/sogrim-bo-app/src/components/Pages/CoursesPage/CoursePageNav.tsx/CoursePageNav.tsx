import { observer } from "mobx-react-lite";
import React from "react";
import { CoursePageMode } from "../../../../types/ui-types";
import { useStore } from "../../../../hooks/useStore";
import { CoursePageTable } from "./CoursePageTable";
import { CoursePageUpdate } from "./CoursePageUpdate";

interface CoursePageNavProps {}

const CoursePageNavComp: React.FC<CoursePageNavProps> = () => {
  const {
    uiStore: { coursePageMode },
  } = useStore();

  switch (coursePageMode) {
    case CoursePageMode.Table:
      return <CoursePageTable />;
    case CoursePageMode.Update:
      return <CoursePageUpdate />;
  }
  return null;
};

export const CoursePageNav = observer(CoursePageNavComp);
