import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ErrorBoundary } from '../src/components/ErrorBoundary.js';

describe('ErrorBoundary', () => {
  it('renders children normally when nothing has thrown', () => {
    const html = renderToString(
      <ErrorBoundary>
        <div>Normal app content</div>
      </ErrorBoundary>
    );
    expect(html).toContain('Normal app content');
  });

  it('getDerivedStateFromError captures the thrown error into state', () => {
    const err = new Error('Simulated render crash: corrupt task in CRDT doc');
    const state = ErrorBoundary.getDerivedStateFromError(err);
    expect(state.error).toBe(err);
  });

  it('renders recovery actions and the error message once state.error is set', () => {
    // React's legacy renderToString (this project's test environment has no
    // jsdom, so only the legacy synchronous SSR path is available) does not
    // invoke componentDidCatch/getDerivedStateFromError the way the client
    // reconciler does — it only re-throws. So this exercises the fallback
    // render() output directly, the same way the class methods above are
    // tested directly, rather than relying on a thrown child to be caught.
    const instance = new ErrorBoundary({ children: null });
    (instance as unknown as { state: { error: Error | null } }).state = {
      error: new Error('Simulated render crash: corrupt task in CRDT doc')
    };

    const html = renderToString(instance.render() as React.ReactElement);

    expect(html).toContain('Lanekeeper hit an unexpected error');
    expect(html).toContain('Simulated render crash: corrupt task in CRDT doc');
    expect(html).toContain('Reload');
    expect(html).toContain('Reset local data and reload');
  });
});
