import { makeAutoObservable } from "mobx";
import { AuthService } from "../services/auth";
import { GoogleClientSession } from "../types/auth-types";

export class AuthStore {
  private authenticated: boolean = false;
  public userCredentialResponse: CredentialResponse = {};
  public googleSession: GoogleClientSession = GoogleClientSession.LOAD;

  constructor(private readonly authService: AuthService) {
    makeAutoObservable(this);
    this.authenticated = false;
  }

  logout = () => {
    window.google?.accounts.id.disableAutoSelect();
    window.location.reload();
  };

  setCredential = (credential: CredentialResponse) => {
    this.userCredentialResponse = credential;
    this.setAuthenticated(true);
  };

  private setAuthenticated(authenticated: boolean) {
    this.authenticated = authenticated;
  }

  get isAuthenticated() {
    return this.authenticated;
  }

  get userAuthToken() {
    if (this.googleSession === GoogleClientSession.DONE) {
      return this.userCredentialResponse.credential;
    }
    return null;
  }

  setGoogleSession = (gss: GoogleClientSession) => {
    this.googleSession = gss;
  };
}
