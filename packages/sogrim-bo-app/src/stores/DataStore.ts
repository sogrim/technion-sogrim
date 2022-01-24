import { makeAutoObservable } from "mobx";
import { Catalog, Course, ThinCatalog } from "../types/data-types";
import { SearchType, SearchOption } from "../types/ui-types";
import { validCourseCredit, validCourseNumber } from "../utils/validator";
import { RootStore } from "./RootStore";

export class DataStore {
  public courses: Course[] = [];
  public catalogsIds: ThinCatalog[] = [];
  public currentCatalog: Catalog | null = null;
  public coursesMutate: boolean = false;
  constructor(public readonly rootStore: RootStore) {
    makeAutoObservable(this, { rootStore: false });
  }

  setCourses = (newCoursesList: Course[]) => {
    this.courses = newCoursesList;
  };

  setCatalogsIds = (catalogs: any) => {
    this.catalogsIds = catalogs;
  };

  setCoursesMutateFalse = () => {
    this.coursesMutate = false;
  };

  updateCourse = (newCourse: Course): boolean => {
    if (this.updatedCourseValidator(newCourse, false)) {
      const oldCourseIdx = this.courses.findIndex(
        (course) => course._id === newCourse._id
      );
      if (oldCourseIdx === -1) {
        this.rootStore.uiStore.setErrorMsg("מספר הקורס לעדכון אינו נמצא.");
        return false;
      }
      this.courses[oldCourseIdx] = newCourse;
      this.rootStore.uiStore.setInfoMsg(`הקורס ${newCourse._id}עודכן בהצלחה`);
      this.coursesMutate = true;
      setTimeout(() => {
        this.setCoursesMutateFalse();
      }, 50);
      return true;
    }
    return false;
  };

  addCourse = (newCourse: Course): boolean => {
    if (this.updatedCourseValidator(newCourse, true)) {
      this.courses.push(newCourse);
      this.rootStore.uiStore.setInfoMsg(`הקורס ${newCourse._id}נוסף בהצלחה`);
      return true;
    }
    return false;
  };

  getSearchOptionByType = (searchType: SearchType): SearchOption[] => {
    const searchOptions: SearchOption[] = [];
    if (searchType === "course-name") {
      this.courses?.forEach((course) => {
        const newSearchCourse: SearchOption = {
          name: course.name + " - " + course._id,
          _id: course._id,
        };
        searchOptions.push(newSearchCourse);
      });
    }
    if (searchType === "catalog-name") {
      this.catalogsIds?.forEach((catalog) => {
        const newSearchCourse: SearchOption = {
          name: catalog.name,
          _id: catalog._id.$oid,
        };
        searchOptions.push(newSearchCourse);
      });
    }
    return searchOptions;
  };

  getCourseById = (id: string): Course | null => {
    let courseToReturn: Course | null = null;
    this.courses.forEach((course) => {
      if (course._id === id) {
        courseToReturn = course;
      }
    });
    return courseToReturn;
  };

  private updatedCourseValidator = (
    newCourse: Course,
    addMode: boolean
  ): boolean => {
    if (!validCourseNumber(newCourse._id)) {
      this.rootStore.uiStore.setErrorMsg(
        "מספר הקורס שהוזן לא תקין. מס׳ קורס תקין מכיל 6 ספרות"
      );
      return false;
    }
    if (!validCourseCredit(newCourse.credit)) {
      this.rootStore.uiStore.setErrorMsg(
        "הנק״ז שהוזן אינו תקין. נק״ז תקין הינו מספר גדול-שווה מאפס, בקפיצות של 0.5"
      );
      return false;
    }
    if (
      addMode &&
      this.courses.filter((course) => course._id === newCourse._id).length !== 0
    ) {
      this.rootStore.uiStore.setErrorMsg(
        "מספר הקורס שהוזן אינו תקין - קיים כבר קורס עם מס׳ קורס זה. תוכלו לערוך אותו במידה ותרצו."
      );
      return false;
    }
    return true;
  };

  setCurrentCatalog = (catalog: Catalog) => {
    this.currentCatalog = catalog;
  };

  updateCatalogName = (catalogName: string) => {
    if (this.currentCatalog) {
      this.currentCatalog.name = catalogName;
    }
  };

  updateCatalogTotalCredit = (totalCredit: string) => {
    if (this.currentCatalog) {
      this.currentCatalog.total_credit = +totalCredit;
    }
  };
}
