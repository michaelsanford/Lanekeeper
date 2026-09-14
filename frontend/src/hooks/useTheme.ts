import { useState, useEffect, useCallback } from 'react';
import {
  type ThemeId,
  THEMES,
  getStoredTheme,
  applyTheme
} from '../utils/themes.js';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeId) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  }, []);

  const currentThemeInfo = THEMES.find((t) => t.id === theme) || THEMES[0];

  return {
    theme,
    setTheme,
    themes: THEMES,
    currentThemeInfo
  };
}
