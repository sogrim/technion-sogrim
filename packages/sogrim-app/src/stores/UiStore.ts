import { RootStore } from "./RootStore";
import { makeAutoObservable } from "mobx";
import { TabState, UserRegistrationState } from "../types/ui-types";
import { UserDetails } from "../types/data-types";

export class UIStore {
  public currentTab: TabState = TabState.DoneTab;
  public userDisplay: any;
  public showMainStatus: boolean = false;
  public semesterTab: number = 0;
  public endGameLoading: boolean = false;
  public userRegistrationState: UserRegistrationState =
    UserRegistrationState.Loading;

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

  setShowMainStatus = (status: boolean) => {
    this.showMainStatus = status;
  };

  setSemesterTab = (semesterTab: number) => {
    this.semesterTab = semesterTab;
  };

  computeUserRegistrationState = (
    userDetails: UserDetails
  ): UserRegistrationState => {
    const degreeStatus = userDetails?.degree_status;
    if (
      degreeStatus?.course_bank_requirements &&
      degreeStatus.course_bank_requirements.length > 0
    ) {
      this.userRegistrationState = UserRegistrationState.Ready;
      return UserRegistrationState.Ready;
    } else if (
      degreeStatus?.course_statuses &&
      degreeStatus.course_statuses.length > 0
    ) {
      this.userRegistrationState = UserRegistrationState.NoComputeValue;
      return UserRegistrationState.NoComputeValue;
    } else if (userDetails?.catalog && userDetails.catalog !== undefined) {
      this.userRegistrationState = UserRegistrationState.NoCourses;
      return UserRegistrationState.NoCourses;
    }
    this.userRegistrationState = UserRegistrationState.NoCatalog;
    return UserRegistrationState.NoCatalog;
  };

  finishEndGameLoading = () => {
    this.endGameLoading = false;
  };

  endGameRefetch = () => {
    this.endGameLoading = true;
    setTimeout(() => {
      this.finishEndGameLoading();
    }, 1500);
  };
}
