import React, { useRef } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { ModalShell } from './ModalShell.js';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'danger'
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  if (!isOpen) return null;

  const defaultConfirmLabel = variant === 'danger' ? 'Delete' : 'Confirm';

  const iconConfig = {
    danger: {
      icon: <AlertTriangle className="w-5 h-5 text-rose-400" aria-hidden="true" />,
      badgeClass: 'bg-rose-950/80 border-rose-800/60',
      confirmButtonClass:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-sm focus:ring-rose-500'
    },
    warning: {
      icon: <AlertCircle className="w-5 h-5 text-amber-400" aria-hidden="true" />,
      badgeClass: 'bg-amber-950/80 border-amber-800/60',
      confirmButtonClass:
        'bg-amber-600 hover:bg-amber-500 text-white shadow-sm focus:ring-amber-500'
    },
    info: {
      icon: <Info className="w-5 h-5 text-indigo-400" aria-hidden="true" />,
      badgeClass: 'bg-indigo-950/80 border-indigo-800/60',
      confirmButtonClass:
        'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm focus:ring-indigo-500'
    }
  }[variant];

  return (
    <ModalShell
      onClose={onClose}
      labelledBy="confirm-modal-title"
      describedBy="confirm-modal-desc"
      initialFocusRef={cancelBtnRef}
      backdropClassName="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
      panelClassName="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 animate-fade-in"
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconConfig.badgeClass}`}
        >
          {iconConfig.icon}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 id="confirm-modal-title" className="font-bold text-base text-slate-100 leading-snug">
            {title}
          </h3>
          <div id="confirm-modal-desc" className="text-xs text-slate-400 mt-2 leading-relaxed">
            {message}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer shrink-0 -mt-1 -mr-1"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5">
        <button
          ref={cancelBtnRef}
          type="button"
          onClick={onClose}
          className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${iconConfig.confirmButtonClass}`}
        >
          {confirmLabel || defaultConfirmLabel}
        </button>
      </div>
    </ModalShell>
  );
};
