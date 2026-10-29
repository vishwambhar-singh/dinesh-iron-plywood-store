import React from "react";
import ReactDOM from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store/store";
import App from "./App";
import { Provider as ChakraProvider } from "./components/ui/provider";
import { Toaster } from "./components/ui/toaster";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <ChakraProvider>
        <App />
        <Toaster />
      </ChakraProvider>
    </ReduxProvider>
  </React.StrictMode>,
);
