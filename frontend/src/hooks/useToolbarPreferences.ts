import { useState, useEffect, useCallback } from 'react';

export type ToolbarRevealMode = 'balanced' | 'zen' | 'expanded';

export const TOOLBAR_REVEAL_STORAGE_KEY = 'lanekeeper_toolbar_reveal_mode';
export const TOOLBAR_REVEAL_CHANGE_EVENT = 'lanekeeper_toolbar_reveal_change';

const DEFAULT_REVEAL_MODE: ToolbarRevealMode = 'balanced';

export function getStoredToolbarRevealMode(): ToolbarRevealMode {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(TOOLBAR_REVEAL_STORAGE_KEY);
      if (saved === 'balanced' || saved === 'zen' || saved === 'expanded') {
        return saved;
      }
    } catch {
      // Fall through to default if localStorage is blocked
    }
  }
  return DEFAULT_REVEAL_MODE;
}

export function saveToolbarRevealMode(mode: ToolbarRevealMode): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(TOOLBAR_REVEAL_STORAGE_KEY, mode);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(TOOLBAR_REVEAL_CHANGE_EVENT, { detail: mode })
    );
  }
}

export function useToolbarPreferences() {
  const [revealMode, setRevealModeState] = useState<ToolbarRevealMode>(getStoredToolbarRevealMode);

  useEffect(() => {
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<ToolbarRevealMode>;
      if (customEvent.detail) {
        setRevealModeState(customEvent.detail);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === TOOLBAR_REVEAL_STORAGE_KEY && e.newValue) {
        if (e.newValue === 'balanced' || e.newValue === 'zen' || e.newValue === 'expanded') {
          setRevealModeState(e.newValue);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(TOOLBAR_REVEAL_CHANGE_EVENT, handleCustomChange);
      window.addEventListener('storage', handleStorage);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(TOOLBAR_REVEAL_CHANGE_EVENT, handleCustomChange);
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, []);

  const setRevealMode = useCallback((mode: ToolbarRevealMode) => {
    setRevealModeState(mode);
    saveToolbarRevealMode(mode);
  }, []);

  return {
    revealMode,
    setRevealMode
  };
}
