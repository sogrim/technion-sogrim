import { RootStore } from "./RootStore";
import { makeAutoObservable } from "mobx";
import { PageState, TabState, UserRegistrationState } from "../types/ui-types";
import { UserDetails, UserPermissions } from "../types/data-types";

export class UIStore {
  public currentPage: PageState = PageState.Main;
  public currentTab: TabState = TabState.DoneTab;
  public currentSemesterIdx: number = 0;
  public userDisplay: any;
  public showMainStatus: boolean = false;
  public endGameLoading: boolean = false;
  public userRegistrationState: UserRegistrationState =
    UserRegistrationState.Loading;
  public permissionMode: UserPermissions = UserPermissions.Student;

  public errorMsg: string = "";

  public rowToDeleteId = "";

  constructor(public readonly rootStore: RootStore) {
    makeAutoObservable(this, { rootStore: false });
  }

  setPage = (isAuthenticated: boolean) => {
    if (this.currentPage === PageState.Main) {
      this.currentPage = PageState.FAQ;
    } else if (isAuthenticated) {
      this.currentPage = PageState.Main;
    }
  };

  get studentMode(): boolean {
    return this.permissionMode === UserPermissions.Student;
  }

  setPermissionMode = (userPermissions: UserPermissions) => {
    this.permissionMode = userPermissions;
  };

  goToMainPage = () => {
    this.currentPage = PageState.Main;
  };

  setUserDisplay = (userDisplay: any) => {
    this.userDisplay = userDisplay;
  };

  setCurrentSemester = (id: number) => {
    this.currentSemesterIdx = id;
  };

  setRowToDelete = (id: string) => {
    this.rowToDeleteId = id;
  };

  get userDisplayName(): string {
    return this.userDisplay?.given_name;
  }

  get displayPicture(): string {
    return this.userDisplay?.picture ?? "";
  }

  setShowMainStatus = (status: boolean) => {
    this.showMainStatus = status;
  };

  setErrorMsg = (newErrorMsg: string) => {
    this.errorMsg = newErrorMsg;
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
    }, 1000);
  };
}
