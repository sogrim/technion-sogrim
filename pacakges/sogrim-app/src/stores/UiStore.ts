import { RootStore } from './RootStore';
import { makeAutoObservable } from 'mobx';
import { TabState } from '../types/ui-types';

export class UIStore {
  public currentTab: TabState = TabState.DoneTab;
  public userDisplay: any;
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
  
}
