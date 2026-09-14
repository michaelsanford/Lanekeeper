import { describe, it, expect, beforeEach } from 'vitest';
import {
  THEMES,
  getStoredTheme,
  applyTheme,
  type ThemeId
} from '../src/utils/themes.js';

describe('Coding Themes Catalog & Manager', () => {
  beforeEach(() => {
    // Clean document and storage mocks
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-theme');
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

  it('defaults to lanekeeper when no theme is stored', () => {
    expect(getStoredTheme()).toBe('lanekeeper');
  });

  it('applies theme to document element and updates storage', () => {
    applyTheme('campbell-powershell');

    if (typeof document !== 'undefined') {
      expect(document.documentElement.getAttribute('data-theme')).toBe('campbell-powershell');
    }
    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem('lanekeeper_theme')).toBe('campbell-powershell');
    }
    expect(getStoredTheme()).toBe('campbell-powershell');
  });

  it('correctly applies the playful Roadworks theme with deep orange accent', () => {
    applyTheme('roadworks');
    expect(getStoredTheme()).toBe('roadworks');
    if (typeof document !== 'undefined') {
      expect(document.documentElement.getAttribute('data-theme')).toBe('roadworks');
    }
    const roadworksTheme = THEMES.find((t) => t.id === 'roadworks');
    expect(roadworksTheme?.name).toBe('Roadworks');
    expect(roadworksTheme?.previewColors.accent).toBe('#ea580c');
  });

  it('maps legacy traffic storage key to roadworks', () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lanekeeper_theme', 'traffic');
      expect(getStoredTheme()).toBe('roadworks');
    }
  });

  it('smoothly switches across various coding themes', () => {
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

    for (const th of testThemes) {
      applyTheme(th);
      expect(getStoredTheme()).toBe(th);
      if (typeof document !== 'undefined') {
        expect(document.documentElement.getAttribute('data-theme')).toBe(th);
      }
    }
  });
});
