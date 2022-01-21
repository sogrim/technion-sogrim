import { RootStore } from "./RootStore";
import { makeAutoObservable } from "mobx";

export class UIStore {
  public userDisplay: any;

  constructor(public readonly rootStore: RootStore) {
    makeAutoObservable(this, { rootStore: false });
  }

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
