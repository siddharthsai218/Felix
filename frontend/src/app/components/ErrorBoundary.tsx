'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Captured by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-6 bg-slate-950/90 text-white rounded-2xl border border-slate-800 text-center">
          <div className="w-10 h-10 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center text-lg mb-2">
            🛡️
          </div>
          <h3 className="text-xs font-semibold mb-1">Display State Preserved</h3>
          <p className="text-[11px] text-slate-400 mb-3 max-w-xs">
            {this.state.error?.message || 'An isolated rendering glitch was prevented from crashing the session.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-3.5 py-1 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all shadow-md"
          >
            Resume View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
