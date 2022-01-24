import { RootStore } from "./RootStore";
import { makeAutoObservable } from "mobx";
import { CatalogPageMode, CoursePageMode } from "../types/ui-types";
import { Catalog, Course } from "../types/data-types";

export class UIStore {
  public errorMsg: string = "";
  public infoMsg: string = "";
  public userDisplay: any;
  public coursePageMode: CoursePageMode = CoursePageMode.Table;
  public catalogPageMode: CatalogPageMode = CatalogPageMode.Update;
  public catalogCRUStep: any;
  public currentCatalog: Catalog | null = null;
  public currentSelectedCourse: Course = {
    name: "",
    credit: 0,
    _id: "",
  };

  constructor(public readonly rootStore: RootStore) {
    makeAutoObservable(this, { rootStore: false });
  }

  setCoursePageMode = (mode: CoursePageMode) => {
    this.coursePageMode = mode;
  };

  setCatalogPageMode = (mode: CatalogPageMode) => {
    this.catalogPageMode = mode;
  };

  setCurrentSelectedCourse = (course: Course) => {
    this.currentSelectedCourse = course;
  };

  setCurrentCatalog = (catalog: Catalog) => {
    this.currentCatalog = catalog;
  };

  setUserDisplay = (userDisplay: any) => {
    this.userDisplay = userDisplay;
  };

  setErrorMsg = (newErrorMsg: string) => {
    this.infoMsg = "";
    this.errorMsg = newErrorMsg;
  };

  setInfoMsg = (newInfoMsg: string) => {
    this.errorMsg = "";
    this.infoMsg = newInfoMsg;
  };

  get userDisplyName(): string {
    return this.userDisplay?.given_name;
  }

  get displayPicture(): string {
    return this.userDisplay?.picture ?? "";
  }
}
