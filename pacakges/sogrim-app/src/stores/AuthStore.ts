import { makeAutoObservable } from 'mobx';
import { LoginRequest } from '../services/auth';
import { AuthService } from '../services/auth';
import jwtDecode from 'jwt-decode';
import { GoogleClinetSession } from '../types/auth-types';

export class AuthStore {
  private authenticated: boolean = false;
  public userCredentialResponse: CredentialResponse = {};
  public googleSession: GoogleClinetSession = GoogleClinetSession.LOAD; 

  constructor(private readonly authService: AuthService) {
    makeAutoObservable(this);
    this.authenticated = !!this.accessToken;
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

  get accessToken() {
    return localStorage.getItem('access_token');
  }

  get isAuthenticated() {
    return this.authenticated;
  }

  setGoogleSession = (gss: GoogleClinetSession) => {
    this.googleSession = gss;
  }
}