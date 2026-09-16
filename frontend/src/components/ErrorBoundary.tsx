import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Lanekeeper's entire UI derives from one CRDT doc; any render-time throw
 * (a malformed task from a bad merge, a laneId pointing nowhere, a corrupt
 * IndexedDB restore) previously white-screened the app with no recovery
 * path, and because the bad state is persisted, reloading reproduced it.
 * This is the single top-level boundary plus a "reset local data" escape
 * hatch that clears the persisted state a reload alone cannot fix.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Unhandled error in Lanekeeper UI:', error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleResetLocalData = async (): Promise<void> => {
    try {
      if ('indexedDB' in window && indexedDB.databases) {
        const dbs = await indexedDB.databases();
        await Promise.all(
          dbs
            .filter((db) => db.name?.startsWith('lanekeeper_'))
            .map(
              (db) =>
                new Promise<void>((resolve) => {
                  const req = indexedDB.deleteDatabase(db.name!);
                  req.onsuccess = () => resolve();
                  req.onerror = () => resolve();
                  req.onblocked = () => resolve();
                })
            )
        );
      }
    } catch {
      // Best effort — still clear localStorage and reload even if IndexedDB
      // enumeration isn't supported in this browser.
    }

    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('lanekeeper_')) {
          localStorage.removeItem(key);
        }
      }
    } catch {}

    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-rose-900/60 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-950/80 border border-rose-800/60 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-400" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-bold text-slate-100">Lanekeeper hit an unexpected error</h1>
          </div>

          <p className="text-sm text-slate-400 mb-4">
            Something in the app crashed while rendering. Your local tasks are still stored on this device — try
            reloading first. If the problem keeps happening, resetting local data will clear this device's copy of
            your project (any changes not yet synced to the server will be lost).
          </p>

          <p className="text-xs font-mono text-slate-500 bg-slate-950/80 border border-slate-800 rounded-lg p-3 mb-5 break-words">
            {this.state.error.message}
          </p>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Reload
            </button>
            <button
              type="button"
              onClick={this.handleResetLocalData}
              className="flex items-center justify-center gap-2 w-full bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 font-medium text-sm px-4 py-2.5 rounded-lg border border-rose-800/60 transition-colors"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Reset local data and reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
