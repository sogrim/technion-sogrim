import { RootStore } from "./RootStore";
import { makeAutoObservable } from "mobx";
import { CoursePageMode } from "../types/ui-types";
import { Course } from "../types/data-types";

export class UIStore {
  public userDisplay: any;
  public coursePageMode: CoursePageMode = CoursePageMode.Table;
  public currentSelectedCourseId: Course | undefined;

  constructor(public readonly rootStore: RootStore) {
    makeAutoObservable(this, { rootStore: false });
  }

  setCoursePageMode = (mode: CoursePageMode) => {
    this.coursePageMode = mode;
  };

  setCurrentSelectedCourse = (course: Course) => {
    this.currentSelectedCourseId = course;
  };

  setUserDisplay = (userDisplay: any) => {
    this.userDisplay = userDisplay;
  };

  get userDisplyName(): string {
    return this.userDisplay?.given_name;
  }

  get displayPicture(): string {
    return this.userDisplay?.picture ?? "";
  }
}
