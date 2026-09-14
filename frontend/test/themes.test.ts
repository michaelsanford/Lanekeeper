import { describe, it, expect, beforeEach } from 'vitest';
import {
  THEMES,
  getStoredTheme,
  getStoredMode,
  applyTheme,
  getThemePreview,
  type ThemeId,
  type ThemeMode
} from '../src/utils/themes.js';

describe('Coding Themes Catalog & Manager', () => {
  beforeEach(() => {
    // Clean document and storage mocks
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.removeAttribute('data-mode');
      document.documentElement.classList.remove('light', 'dark');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('contains famous and popular coding colour themes including Campbell and Roadworks', () => {
    expect(THEMES.length).toBe(13);

    const expectedIds: ThemeId[] = [
      'lanekeeper',
      'dracula',
      'tokyo-night',
      'catppuccin',
      'nord',
      'one-dark',
      'github-dark',
      'monokai',
      'gruvbox',
      'solarized',
      'campbell-powershell',
      'campbell',
      'roadworks'
    ];

    for (const expectedId of expectedIds) {
      const found = THEMES.find((t) => t.id === expectedId);
      expect(found).toBeDefined();
      expect(found?.name).toBeTruthy();
      expect(found?.authorOrOrigin).toBeTruthy();
      expect(found?.description).toBeTruthy();
      expect(found?.previewColors.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(found?.previewColors.surface).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(found?.previewColors.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('provides tailored light and dark palettes for all 13 themes', () => {
    for (const theme of THEMES) {
      // Dark mode palette
      const darkPreview = getThemePreview(theme, 'dark');
      expect(darkPreview.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(darkPreview.surface).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(darkPreview.border).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(darkPreview.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(darkPreview.text).toMatch(/^#[0-9a-fA-F]{6}$/);

      // Light mode palette
      const lightPreview = getThemePreview(theme, 'light');
      expect(lightPreview.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(lightPreview.surface).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(lightPreview.border).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(lightPreview.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(lightPreview.text).toMatch(/^#[0-9a-fA-F]{6}$/);

      // Light mode background is light and dark mode background is dark
      expect(darkPreview.bg).not.toBe(lightPreview.bg);
    }
  });

  it('defaults to lanekeeper and dark mode when none is stored', () => {
    expect(getStoredTheme()).toBe('lanekeeper');
    expect(getStoredMode()).toBe('dark');
  });

  it('applies theme and mode to document element and updates storage', () => {
    applyTheme('campbell-powershell', 'light');

    if (typeof document !== 'undefined') {
      expect(document.documentElement.getAttribute('data-theme')).toBe('campbell-powershell');
      expect(document.documentElement.getAttribute('data-mode')).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    }
    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem('lanekeeper_theme')).toBe('campbell-powershell');
      expect(localStorage.getItem('lanekeeper_theme_mode')).toBe('light');
    }
    expect(getStoredTheme()).toBe('campbell-powershell');
    expect(getStoredMode()).toBe('light');
  });

  it('correctly applies the playful Roadworks theme in both dark and light modes', () => {
    // Dark mode Roadworks
    applyTheme('roadworks', 'dark');
    expect(getStoredTheme()).toBe('roadworks');
    expect(getStoredMode()).toBe('dark');
    if (typeof document !== 'undefined') {
      expect(document.documentElement.getAttribute('data-theme')).toBe('roadworks');
      expect(document.documentElement.getAttribute('data-mode')).toBe('dark');
    }

    const roadworksTheme = THEMES.find((t) => t.id === 'roadworks')!;
    const darkPreview = getThemePreview(roadworksTheme, 'dark');
    expect(darkPreview.accent).toBe('#ea580c');
    expect(darkPreview.bg).toBe('#111316');

    // Light mode Roadworks
    applyTheme('roadworks', 'light');
    expect(getStoredMode()).toBe('light');
    if (typeof document !== 'undefined') {
      expect(document.documentElement.getAttribute('data-mode')).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
    }
    const lightPreview = getThemePreview(roadworksTheme, 'light');
    expect(lightPreview.accent).toBe('#ea580c');
    expect(lightPreview.bg).toBe('#f4f4f6');
  });

  it('smoothly switches across various coding themes and modes', () => {
    const testThemes: ThemeId[] = [
      'tokyo-night',
      'catppuccin',
      'nord',
      'one-dark',
      'github-dark',
      'monokai',
      'gruvbox',
      'solarized',
      'campbell-powershell',
      'campbell',
      'roadworks'
    ];

    const modes: ThemeMode[] = ['light', 'dark'];

    for (const th of testThemes) {
      for (const m of modes) {
        applyTheme(th, m);
        expect(getStoredTheme()).toBe(th);
        expect(getStoredMode()).toBe(m);
        if (typeof document !== 'undefined') {
          expect(document.documentElement.getAttribute('data-theme')).toBe(th);
          expect(document.documentElement.getAttribute('data-mode')).toBe(m);
        }
      }
    }
  });
});
