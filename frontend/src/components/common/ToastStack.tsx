import { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { subscribeToasts, dismissToast, type Toast } from '../../utils/toast.js';

const VARIANT_STYLES: Record<Toast['variant'], { className: string; Icon: typeof Info }> = {
  info: { className: 'bg-slate-900 border-slate-700 text-slate-200', Icon: Info },
  warning: { className: 'bg-amber-950/90 border-amber-700/80 text-amber-200', Icon: AlertTriangle },
  error: { className: 'bg-rose-950/90 border-rose-700/80 text-rose-200', Icon: AlertCircle }
};

/** Renders active toasts in a fixed corner stack, in a polite live region so screen readers announce new ones without interrupting. */
export function ToastStack() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const { className, Icon } = VARIANT_STYLES[toast.variant];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl border shadow-2xl text-sm animate-fade-in ${className}`}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
