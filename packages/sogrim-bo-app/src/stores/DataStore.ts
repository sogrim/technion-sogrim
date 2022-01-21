import { makeAutoObservable } from "mobx";
import { RootStore } from "./RootStore";

export class DataStore {
  constructor(public readonly rootStore: RootStore) {
    makeAutoObservable(this, { rootStore: false });
  }
}
