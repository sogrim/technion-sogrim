import { makeAutoObservable } from 'mobx';
import { RootStore } from './RootStore';

export class DataStore {
  public isLogin: boolean = false;

  constructor(
    public readonly rootStore: RootStore,
  ) {
    makeAutoObservable(this, { rootStore: false });
  }
 
}
