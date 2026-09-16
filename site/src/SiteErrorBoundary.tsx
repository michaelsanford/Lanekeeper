import React from 'react';

interface SiteErrorBoundaryProps {
  children: React.ReactNode;
}

interface SiteErrorBoundaryState {
  error: Error | null;
}

/**
 * A minimal top-level boundary for the marketing page. Unlike the product's
 * own ErrorBoundary, there is no persisted local state to reset here -- a
 * live-demo component throwing should never take the whole page down with it.
 */
export class SiteErrorBoundary extends React.Component<SiteErrorBoundaryProps, SiteErrorBoundaryState> {
  constructor(props: SiteErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): SiteErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Lanekeeper site: unrecoverable render error', error, info);
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-xl font-bold">Something broke on this page</h1>
            <p className="text-sm text-slate-400">
              The live demo hit an unexpected error. Reloading the page will start it fresh.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
