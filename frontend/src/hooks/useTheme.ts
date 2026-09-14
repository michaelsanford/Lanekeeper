import { useState, useEffect, useCallback } from 'react';
import {
  type ThemeId,
  type ThemeMode,
  THEMES,
  getStoredTheme,
  getStoredMode,
  applyTheme
} from '../utils/themes.js';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(getStoredTheme);
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);

  useEffect(() => {
    applyTheme(theme, mode);
  }, [theme, mode]);

  const setTheme = useCallback((newTheme: ThemeId) => {
    setThemeState(newTheme);
    applyTheme(newTheme, mode);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    applyTheme(theme, newMode);
  }, [theme]);

  const toggleMode = useCallback(() => {
    const nextMode: ThemeMode = mode === 'light' ? 'dark' : 'light';
    setModeState(nextMode);
    applyTheme(theme, nextMode);
  }, [theme, mode]);

  const currentThemeInfo = THEMES.find((t) => t.id === theme) || THEMES[0];

  return {
    theme,
    mode,
    setTheme,
    setMode,
    toggleMode,
    themes: THEMES,
    currentThemeInfo
  };
}
