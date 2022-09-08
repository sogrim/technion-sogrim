import * as React from "react";
import { RootStore } from "../stores/RootStore";

interface StoreProviderProps {
  store: RootStore;
}

export const StoreContext = React.createContext({} as RootStore);

export const StoreProvider: React.FC<StoreProviderProps> = ({
  store,
  children,
}) => <StoreContext.Provider value={store}> {children}</StoreContext.Provider>;

export const useStore = () => {
  const store = React.useContext(StoreContext);

  if (!store) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return store;
};
