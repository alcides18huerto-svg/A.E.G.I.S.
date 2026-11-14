import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, info: ErrorInfo | null) => ReactNode);
  title?: string;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
    console.error('A.E.G.I.S. render error', error, info.componentStack);

    try {
      if (window.self !== window.top) {
        window.parent.postMessage(
          {
            type: 'aegis-runtime-error',
            payload: {
              message: error.message,
              stack: error.stack?.slice(0, 4000) ?? '',
              componentStack: info.componentStack?.slice(0, 4000) ?? '',
            },
          },
          '*',
        );
      }
    } catch {
      // cross-frame reporting is best-effort only
    }
  }

  private reset = () => {
    this.setState({ error: null, info: null });
  };

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    if (typeof this.props.fallback === 'function') {
      return this.props.fallback(error, info);
    }
    if (this.props.fallback) return this.props.fallback;

    return (
      <div role="alert" className="glass-panel rounded-2xl p-6 text-sm text-slate-300">
        <p className="font-semibold text-white">
          {this.props.title ?? 'No se pudo mostrar esta sección'}
        </p>
        <p className="mt-2 break-words text-xs text-slate-500">{error.message}</p>
        <button
          type="button"
          onClick={this.reset}
          className="mt-4 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 transition-colors hover:bg-cyan-500/20"
        >
          Reintentar
        </button>
      </div>
    );
  }
}
