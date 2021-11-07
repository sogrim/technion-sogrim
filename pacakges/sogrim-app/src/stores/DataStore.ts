import { makeAutoObservable } from 'mobx';
import { RootStore } from './RootStore';

export class DataStore {
  public isLogin: boolean = false;
  public userState: any;

  constructor(
    public readonly rootStore: RootStore,
  ) {
    makeAutoObservable(this, { rootStore: false });
  }

  get userHasDegreeStatus() {
    return false;
  }
 
}
