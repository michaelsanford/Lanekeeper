import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { showToast, dismissToast, subscribeToasts, resetToastsForTesting } from '../src/utils/toast.js';

describe('toast utility', () => {
  beforeEach(() => {
    resetToastsForTesting();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('notifies subscribers immediately on subscribe with the current (empty) list', () => {
    const listener = vi.fn();
    subscribeToasts(listener);
    expect(listener).toHaveBeenCalledWith([]);
  });

  it('adds a toast and notifies subscribers', () => {
    const listener = vi.fn();
    subscribeToasts(listener);
    listener.mockClear();

    const id = showToast('Sync failed', 'error', 0);

    expect(listener).toHaveBeenCalledTimes(1);
    const [toasts] = listener.mock.calls[0];
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ id, message: 'Sync failed', variant: 'error' });
  });

  it('defaults to the info variant', () => {
    const listener = vi.fn();
    subscribeToasts(listener);
    listener.mockClear();
    showToast('Just letting you know', undefined, 0);
    const [toasts] = listener.mock.calls[0];
    expect(toasts[0].variant).toBe('info');
  });

  it('auto-dismisses after the given duration', () => {
    const listener = vi.fn();
    subscribeToasts(listener);
    showToast('Temporary', 'info', 1000);
    listener.mockClear();

    vi.advanceTimersByTime(1000);

    const [toasts] = listener.mock.calls.at(-1)!;
    expect(toasts).toHaveLength(0);
  });

  it('never auto-dismisses when durationMs is 0', () => {
    const listener = vi.fn();
    subscribeToasts(listener);
    showToast('Persistent', 'warning', 0);
    vi.advanceTimersByTime(60_000);
    const [toasts] = listener.mock.calls.at(-1)!;
    expect(toasts).toHaveLength(1);
  });

  it('dismissToast removes only the targeted toast', () => {
    const listener = vi.fn();
    subscribeToasts(listener);
    const idA = showToast('First', 'info', 0);
    const idB = showToast('Second', 'info', 0);
    listener.mockClear();

    dismissToast(idA);

    const [toasts] = listener.mock.calls[0];
    expect(toasts.map((t: { id: string }) => t.id)).toEqual([idB]);
  });

  it('unsubscribing stops further notifications', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToasts(listener);
    listener.mockClear();
    unsubscribe();

    showToast('Should not be seen', 'info', 0);

    expect(listener).not.toHaveBeenCalled();
  });
});
