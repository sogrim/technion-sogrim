import React from 'react'
import { AuthStore } from '../stores/AuthStore';

interface AuthProviderProps {
  authStore: AuthStore;
}



export const AuthContext = React.createContext({} as AuthStore);

export const AuthProvider: React.FC<AuthProviderProps> = ({
  authStore,
  children,
}) => <AuthContext.Provider value={authStore} > {children}</AuthContext.Provider>;

export const useAuth = () => {
  const authStore = React.useContext(AuthContext);

  if (!authStore) {
    throw new Error('useAuth must be used within a StoreProvider');
  }
  return authStore;
};
