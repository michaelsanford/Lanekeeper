import { useEffect } from 'react';

interface ShortcutsProps {
  onOpenQuickCapture: () => void;
  onToggleFlightDeck: () => void;
  onCloseModals: () => void;
  onToggleHelp: () => void;
}

export function useKeyboardShortcuts({
  onOpenQuickCapture,
  onToggleFlightDeck,
  onCloseModals,
  onToggleHelp
}: ShortcutsProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don'\''t trigger global shortcuts when typing inside inputs or textareas
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Escape') {
        onCloseModals();
        return;
      }

      if (isInput) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenQuickCapture();
      } else if (e.key.toLowerCase() === 'c') {
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
  }, [onOpenQuickCapture, onToggleFlightDeck, onCloseModals, onToggleHelp]);
}
