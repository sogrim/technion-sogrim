import { makeAutoObservable } from "mobx";
import { Course } from "../types/data-types";
import { SearchType, SearchOption } from "../types/ui-types";
import { RootStore } from "./RootStore";

export class DataStore {
  public courses: Course[] = [];
  constructor(public readonly rootStore: RootStore) {
    makeAutoObservable(this, { rootStore: false });
  }

  setCourses = (newCoursesList: Course[]) => {
    this.courses = newCoursesList;
  };

  getSearchOptionByType = (searchType: SearchType): SearchOption[] => {
    const searchOptions: SearchOption[] = [];
    if (searchType === "course-name") {
      this.courses.forEach((course) => {
        const newSearchCourse: SearchOption = {
          name: course.name + " - " + course._id,
          _id: course._id,
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
}
