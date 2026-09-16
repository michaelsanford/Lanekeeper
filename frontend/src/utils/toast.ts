export type ToastVariant = 'info' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

type ToastListener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<ToastListener>();
let nextId = 0;

function notify(): void {
  for (const listener of listeners) {
    listener(toasts);
  }
}

export function subscribeToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

/**
 * Shows a transient, non-blocking notification (rendered by ToastStack in
 * an aria-live region). Use this instead of console.warn/error or alert()
 * for anything the user needs to actually see — a failed sync, a
 * degraded offline state, an unsupported feature.
 */
export function showToast(message: string, variant: ToastVariant = 'info', durationMs = 6000): string {
  const id = `toast-${++nextId}`;
  toasts = [...toasts, { id, message, variant }];
  notify();
  if (durationMs > 0) {
    setTimeout(() => dismissToast(id), durationMs);
  }
  return id;
}

/** Test-only: clears all toasts and listeners between test cases. */
export function resetToastsForTesting(): void {
  toasts = [];
  listeners.clear();
  nextId = 0;
}
