import { makeAutoObservable } from 'mobx';
import { AuthService } from '../services/auth';
import { GoogleClinetSession } from '../types/auth-types';

export class AuthStore {
  private authenticated: boolean = false;
  public userCredentialResponse: CredentialResponse = {};
  public googleSession: GoogleClinetSession = GoogleClinetSession.LOAD; 

  constructor(private readonly authService: AuthService) {
    makeAutoObservable(this);
    this.authenticated = false;
  }

  logout = () => {
      window.google?.accounts.id.disableAutoSelect();
      window.location.reload();
  }

  setCredential = (credential: CredentialResponse) => {
      this.userCredentialResponse = credential;
      this.setAuthenticated(true);
  }

  private setAuthenticated(authenticated: boolean) {
    this.authenticated = authenticated;
  }

  get isAuthenticated() {
    return this.authenticated;
  }

  setGoogleSession = (gss: GoogleClinetSession) => {
    this.googleSession = gss;
  }
}