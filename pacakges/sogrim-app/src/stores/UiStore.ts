import { RootStore } from './RootStore';
import { makeAutoObservable } from 'mobx';
import { TabState } from '../types/ui-types';

export class UIStore {
  public currentTab: TabState = TabState.DoneTab;
  // TODO: public scrollToTopRef: HTMLDivElement = null;
  // TODO: public notificationParams: NotificationParams = initalNotificationParams;

  constructor(public readonly rootStore: RootStore) {
    makeAutoObservable(this, { rootStore: false });
  }
  
}
