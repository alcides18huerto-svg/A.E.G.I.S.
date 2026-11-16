import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import FatalError from "./components/FatalError.tsx";
import { I18nProvider } from "./i18n/LanguageContext.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <ErrorBoundary fallback={(error, info) => <FatalError error={error} info={info} />}>
      <App />
    </ErrorBoundary>
  </I18nProvider>,
);
