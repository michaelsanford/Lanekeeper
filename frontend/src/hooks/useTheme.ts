import { useState, useEffect, useCallback } from 'react';
import {
  type ThemeId,
  type ThemeMode,
  type FontId,
  THEMES,
  FONTS,
  getStoredTheme,
  getStoredMode,
  getStoredFont,
  applyTheme,
  applyFont,
  getFontInfo
} from '../utils/themes.js';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(getStoredTheme);
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const [font, setFontState] = useState<FontId>(getStoredFont);

  useEffect(() => {
    applyTheme(theme, mode);
  }, [theme, mode]);

  useEffect(() => {
    applyFont(font);
  }, [font]);

  const setTheme = useCallback((newTheme: ThemeId) => {
    setThemeState(newTheme);
    applyTheme(newTheme, mode);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    applyTheme(theme, newMode);
  }, [theme]);

  const setFont = useCallback((newFont: FontId) => {
    setFontState(newFont);
    applyFont(newFont);
  }, []);

  const toggleMode = useCallback(() => {
    const nextMode: ThemeMode = mode === 'light' ? 'dark' : 'light';
    setModeState(nextMode);
    applyTheme(theme, nextMode);
  }, [theme, mode]);

  const currentThemeInfo = THEMES.find((t) => t.id === theme) || THEMES[0];
  const currentFontInfo = getFontInfo(font);

  return {
    theme,
    mode,
    font,
    setTheme,
    setMode,
    setFont,
    toggleMode,
    themes: THEMES,
    fonts: FONTS,
    currentThemeInfo,
    currentFontInfo
  };
}

