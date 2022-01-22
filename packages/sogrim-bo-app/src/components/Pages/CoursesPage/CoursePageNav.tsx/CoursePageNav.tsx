import { observer } from "mobx-react-lite";
import React from "react";
import { CoursePageMode } from "../../../../types/ui-types";
import { useStore } from "../../../../hooks/useStore";

interface CoursePageNavProps {}

const CoursePageNavComp: React.FC<CoursePageNavProps> = () => {
  const {
    uiStore: { coursePageMode },
  } = useStore();

  switch (coursePageMode) {
    case CoursePageMode.Table:
      return <>table</>;
    case CoursePageMode.Update:
      return <>updatge</>;
    case CoursePageMode.Add:
      return <>new</>;
  }
};

export const CoursePageNav = observer(CoursePageNavComp);
