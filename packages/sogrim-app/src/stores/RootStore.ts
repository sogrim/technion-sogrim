import { makeAutoObservable } from "mobx";
import { DataStore } from "./DataStore";
import { UIStore } from "./UiStore";

export class RootStore {
  public uiStore: UIStore;
  public dataStore: DataStore;

  constructor() {
    makeAutoObservable(this);
    this.uiStore = new UIStore(this);
    this.dataStore = new DataStore(this);
  }
}
