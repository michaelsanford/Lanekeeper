import React, { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function isVisible(el: HTMLElement): boolean {
  return el.offsetParent !== null;
}

// Reference-counted so two modals open at once (e.g. one launched from
// within another) don't have the first one's close prematurely re-enable
// background scroll while the second is still open.
let openModalCount = 0;
let previousBodyOverflow = '';

function lockScroll(): void {
  if (openModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  openModalCount++;
}

function unlockScroll(): void {
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
}

interface ModalShellProps {
  onClose: () => void;
  /** id of an element (rendered by the caller, inside children) that names this dialog. */
  labelledBy?: string;
  /** Use instead of labelledBy when there's no visible heading to reference. */
  ariaLabel?: string;
  describedBy?: string;
  children: React.ReactNode;
  /** Classes for the full-screen backdrop; clicking it closes the modal. */
  backdropClassName?: string;
  /** Classes for the dialog panel itself. */
  panelClassName?: string;
  /** Focus this element on open instead of the first focusable descendant. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const DEFAULT_BACKDROP_CLASS =
  'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in';

/**
 * Shared modal chrome: dialog semantics, a focus trap, initial focus,
 * restoring focus to the trigger on close, and reference-counted background
 * scroll locking. The rest of the app (Header/main) is made inert while any
 * instance is mounted — see App.tsx's isAnyModalOpen.
 *
 * This component is only ever mounted while open — callers keep their own
 * `if (!isOpen) return null` guard before rendering it, so mount/unmount
 * IS the open/close lifecycle here.
 */
export function ModalShell({
  onClose,
  labelledBy,
  ariaLabel,
  describedBy,
  children,
  backdropClassName,
  panelClassName,
  initialFocusRef
}: ModalShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Captured once at render time, not inside the effect below: React
  // StrictMode double-invokes that effect (mount -> cleanup -> mount) right
  // after this dialog opens, and at that instant the trigger is still
  // `inert` (the background only stops being inert once this dialog
  // actually closes) — inert elements silently refuse focus(), so a
  // freshly-`document.activeElement`-captured value inside the effect can
  // get corrupted into the dialog's own first focusable element by that
  // simulated cleanup. A ref set once during render is immune to that.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  if (previouslyFocusedRef.current === null && typeof document !== 'undefined') {
    previouslyFocusedRef.current = document.activeElement as HTMLElement;
  }

  useEffect(() => {
    lockScroll();

    const toFocus =
      initialFocusRef?.current ||
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ||
      panelRef.current;
    toFocus?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        isVisible
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      unlockScroll();
      previouslyFocusedRef.current?.focus?.();
    };
    // Deliberately mount/unmount-scoped only, see the doc comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={backdropClassName ?? DEFAULT_BACKDROP_CLASS} onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        className={panelClassName}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
