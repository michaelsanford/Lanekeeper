import { useState, useEffect, useCallback, useRef } from 'react';

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

export interface UseHoverRevealOptions {
  holdDelayMs?: number;
}

export class HoverRevealController {
  public holdDelayMs: number;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private onChange?: (isRevealed: boolean) => void;
  public isRevealed: boolean = false;

  constructor(options: { holdDelayMs?: number; onChange?: (isRevealed: boolean) => void } = {}) {
    this.holdDelayMs = options.holdDelayMs ?? 1000;
    this.onChange = options.onChange;
  }

  public handleMouseEnter = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isRevealed = true;
    this.onChange?.(true);
  };

  public handleMouseLeave = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.isRevealed = false;
      this.timeoutId = null;
      this.onChange?.(false);
    }, this.holdDelayMs);
  };

  public closeImmediate = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isRevealed = false;
    this.onChange?.(false);
  };

  public dispose = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  };
}

export function useHoverReveal(options: UseHoverRevealOptions = {}) {
  const { holdDelayMs = 1000 } = options;
  const [isRevealed, setIsRevealed] = useState(false);
  const controllerRef = useRef<HoverRevealController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new HoverRevealController({
      holdDelayMs,
      onChange: setIsRevealed
    });
  } else {
    controllerRef.current.holdDelayMs = holdDelayMs;
  }

  useEffect(() => {
    const controller = controllerRef.current;
    return () => {
      controller?.dispose();
    };
  }, []);

  const controller = controllerRef.current;

  return {
    isRevealed,
    setIsRevealed,
    closeImmediate: controller.closeImmediate,
    bind: {
      onMouseEnter: controller.handleMouseEnter,
      onMouseLeave: controller.handleMouseLeave,
      onFocus: controller.handleMouseEnter,
      onBlur: controller.handleMouseLeave
    }
  };
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
