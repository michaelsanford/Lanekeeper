import { describe, it, expect, beforeEach } from 'vitest';
import {
  FONTS,
  getStoredFont,
  applyFont,
  getFontInfo,
  FONT_STORAGE_KEY,
  type FontId
} from '../src/utils/fonts.js';

describe('Typography & Web Fonts Catalog', () => {
  beforeEach(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-font');
      document.documentElement.style.removeProperty('--lk-font-family');
      document.documentElement.style.removeProperty('--lk-font-mono');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('contains 6 Google web fonts appropriate for developer workflows, OpenDyslexic, and System Default', () => {
    expect(FONTS.length).toBe(8);

    const expectedGoogleFonts: FontId[] = [
      'inter',
      'jetbrains-mono',
      'fira-code',
      'ibm-plex-sans',
      'plus-jakarta-sans',
      'space-grotesk'
    ];

    for (const id of expectedGoogleFonts) {
      const font = FONTS.find((f) => f.id === id);
      expect(font).toBeDefined();
      expect(font?.category).toBe('google');
      expect(font?.badgeText).toBe('Google Web Font');
      expect(font?.name).toBeTruthy();
      expect(font?.designerOrOrigin).toBeTruthy();
      expect(font?.description).toBeTruthy();
      expect(font?.fontFamily).toBeTruthy();
      expect(font?.sampleText).toBeTruthy();
    }

    // Verify OpenDyslexic accessibility font
    const dyslexicFont = FONTS.find((f) => f.id === 'opendyslexic');
    expect(dyslexicFont).toBeDefined();
    expect(dyslexicFont?.name).toBe('OpenDyslexic');
    expect(dyslexicFont?.category).toBe('dyslexic');
    expect(dyslexicFont?.badgeText).toBe('Dyslexia Accessibility');
    expect(dyslexicFont?.fontFamily).toContain('OpenDyslexic');
    expect(dyslexicFont?.monoFontFamily).toContain('OpenDyslexic');

    // Verify System Default font
    const systemFont = FONTS.find((f) => f.id === 'system');
    expect(systemFont).toBeDefined();
    expect(systemFont?.category).toBe('system');
    expect(systemFont?.badgeText).toBe('System Native');
  });

  it('defaults to system font when none is stored', () => {
    expect(getStoredFont()).toBe('system');
  });

  it('reads stored font from localStorage', () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FONT_STORAGE_KEY, 'jetbrains-mono');
      expect(getStoredFont()).toBe('jetbrains-mono');
    }
  });

  it('falls back to default font if invalid id in localStorage', () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FONT_STORAGE_KEY, 'non-existent-font');
      expect(getStoredFont()).toBe('system');
    }
  });

  it('applies font to document element and updates localStorage', () => {
    applyFont('opendyslexic');

    if (typeof document !== 'undefined') {
      expect(document.documentElement.getAttribute('data-font')).toBe('opendyslexic');
      expect(document.documentElement.style.getPropertyValue('--lk-font-family')).toContain('OpenDyslexic');
      expect(document.documentElement.style.getPropertyValue('--lk-font-mono')).toContain('OpenDyslexic');
    }

    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem(FONT_STORAGE_KEY)).toBe('opendyslexic');
    }
  });

  it('applies Google font and handles monospace overrides', () => {
    applyFont('jetbrains-mono');

    if (typeof document !== 'undefined') {
      expect(document.documentElement.getAttribute('data-font')).toBe('jetbrains-mono');
      expect(document.documentElement.style.getPropertyValue('--lk-font-family')).toContain('JetBrains Mono');
      expect(document.documentElement.style.getPropertyValue('--lk-font-mono')).toContain('JetBrains Mono');
    }

    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem(FONT_STORAGE_KEY)).toBe('jetbrains-mono');
    }
  });

  it('retrieves font info by id with fallback', () => {
    const inter = getFontInfo('inter');
    expect(inter.name).toBe('Inter');
    expect(inter.category).toBe('google');

    const fallback = getFontInfo('unknown' as FontId);
    expect(fallback.id).toBe('system');
  });
});
