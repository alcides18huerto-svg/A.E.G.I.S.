import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary
    fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="glass-panel max-w-lg rounded-2xl p-6 text-sm text-slate-300">
          <p className="text-base font-semibold text-white">A.E.G.I.S. no pudo iniciar</p>
          <p className="mt-2 text-xs text-slate-500">
            Recarga la página. Si el problema continúa, revisa la consola del navegador.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 transition-colors hover:bg-cyan-500/20"
          >
            Recargar
          </button>
        </div>
      </div>
    }
  >
    <App />
  </ErrorBoundary>,
);
