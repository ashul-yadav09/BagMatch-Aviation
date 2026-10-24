import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-2xl text-center">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Display State Interrupted</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              An unexpected condition occurred while rendering this interface. Your data remains safe on the platform.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
