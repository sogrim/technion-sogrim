import { API_URL } from './api-url'

export interface LoginRequest {
    // TODO
}

export class AuthService {
  async login(loginRequest: LoginRequest) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginRequest),
    });

    const parsedResponse = await response.json();

    if (!response.ok) {
      throw new Error(parsedResponse);
    }

    return parsedResponse;
  }
}


