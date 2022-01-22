import { makeAutoObservable } from "mobx";
import { Course } from "../types/data-types";
import { SearchType, SearchOption } from "../types/ui-types";
import { RootStore } from "./RootStore";

export class DataStore {
  constructor(public readonly rootStore: RootStore) {
    makeAutoObservable(this, { rootStore: false });
  }

  getSearchOptionByType = (searchType: SearchType): SearchOption[] => {
    const x = [
      {
        name: "niso",
        _id: "1",
      },
      {
        name: "leelush",
        _id: "2",
      },
      {
        name: "david",
        _id: "3",
      },
    ];
    return x;
  };

  getCourseById = (id: string): Course => {
    return {
      name: "אחלה קורס",
      _id: "012345",
      credit: 5.5,
    };
  };
}
