import { useEffect } from 'react';

export interface ModalCloseTarget {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutsProps {
  onOpenQuickCapture: () => void;
  onToggleFlightDeck: () => void;
  onToggleHelp: () => void;
  /** Ordered front-to-back (topmost first); Escape closes only the first entry that is open. */
  closeTargets: ModalCloseTarget[];
  /** True while any modal/drawer is open, to suppress bare single-letter shortcuts underneath it. */
  isAnyModalOpen: boolean;
}

export function useKeyboardShortcuts({
  onOpenQuickCapture,
  onToggleFlightDeck,
  onToggleHelp,
  closeTargets,
  isAnyModalOpen
}: ShortcutsProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger global shortcuts when typing inside inputs or textareas
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Escape') {
        // Close only the topmost open modal, not every open surface at once.
        const topmost = closeTargets.find((t) => t.isOpen);
        if (topmost) {
          e.preventDefault();
          topmost.onClose();
        }
        return;
      }

      if (isInput) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenQuickCapture();
        return;
      }

      // Bare single-letter shortcuts must never fire alongside a modifier
      // key (this used to hijack Ctrl+C / Cmd+C system copy) and must not
      // fire while a modal is open and capturing keyboard focus elsewhere.
      if (e.metaKey || e.ctrlKey || e.altKey || isAnyModalOpen) {
        return;
      }

      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        onOpenQuickCapture();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        onToggleFlightDeck();
      } else if (e.key === '?') {
        e.preventDefault();
        onToggleHelp();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onOpenQuickCapture, onToggleFlightDeck, onToggleHelp, closeTargets, isAnyModalOpen]);
}
