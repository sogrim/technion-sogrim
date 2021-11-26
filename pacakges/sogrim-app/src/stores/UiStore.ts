import { RootStore } from './RootStore';
import { makeAutoObservable } from 'mobx';
import { TabState, UserRegistrationState } from '../types/ui-types';
import { UserState } from '../types/data-types';

export class UIStore {
  public currentTab: TabState = TabState.DoneTab;
  public userDisplay: any;
  public showMainStatus: boolean = false;
  public semesterTab: number = 0;
  
  // TODO: public scrollToTopRef: HTMLDivElement = null;
  // TODO: public notificationParams: NotificationParams = initalNotificationParams;


  constructor(public readonly rootStore: RootStore) {
    makeAutoObservable(this, { rootStore: false });
  }

  get showDegreeStatusCard() {
    return this.rootStore.dataStore.userHasDegreeStatus;
  }

  setUserDisplay = (userDisplay: any) => {
    this.userDisplay = userDisplay;
  }

  get userDisplyName(): string{
    return this.userDisplay?.given_name;
  }

  get displayPicture(): string {
    return this.userDisplay?.picture ?? '';
  }

  setShowMainStatus = (status: boolean) => {
    this.showMainStatus = status;
  }

  setSemesterTab = (semesterTab: number) => {
    this.semesterTab = semesterTab;
  }

  userRegistrationState = (userState: UserState): UserRegistrationState => {    
    const degreeStatus = userState?.details?.degree_status;
    if (degreeStatus?.course_bank_requirements && degreeStatus.course_bank_requirements.length > 0) {
      return UserRegistrationState.Ready;
    } else if (degreeStatus?.course_statuses && degreeStatus.course_statuses.length > 0) {
      return UserRegistrationState.NoComputeValue;
    } else if (userState?.details?.catalog && userState.details.catalog !== undefined) {
      return UserRegistrationState.NoCourses;
    }  
    return UserRegistrationState.NoCatalog    
  }
  
}
