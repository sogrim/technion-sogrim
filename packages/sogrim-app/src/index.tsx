import React from "react";
import ReactDOM from "react-dom/client";
import { configure as mobxConfigure } from "mobx";
import "./index.css";
import { App } from "./components/App/App";
import reportWebVitals from "./reportWebVitals";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { RootStore } from "./stores/RootStore";
import { StoreProvider } from "./hooks/useStore";
import { AuthService } from "./services/auth";
import { AuthStore } from "./stores/AuthStore";
import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient();

mobxConfigure({
  enforceActions: "observed",
  isolateGlobalState: true,
});

const appStore = new RootStore();
const authService = new AuthService();
const authStore = new AuthStore(authService);
const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider authStore={authStore}>
        <StoreProvider store={appStore}>
          <App />
        </StoreProvider>
      </AuthProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  </React.StrictMode>
);

// TODO: check about this
reportWebVitals();
