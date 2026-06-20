/// <reference types="vite/client" />

interface CredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    auto_select?: boolean;
    callback: (response: CredentialResponse) => void;
  }) => void;
  prompt: (callback: (notification: unknown) => void) => void;
  renderButton: (
    element: HTMLElement,
    config: Record<string, unknown>,
  ) => void;
  disableAutoSelect: () => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

export {};
