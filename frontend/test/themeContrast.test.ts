import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = resolve(__dirname, '../src/index.css');

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function luminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(a: string, b: string): number {
  const l1 = luminance(hexToRgb(a));
  const l2 = luminance(hexToRgb(b));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

type ThemeStops = Record<string, string>;
type ThemeData = Record<string, Record<'dark' | 'light', ThemeStops>>;

/**
 * Parses the --lk-slate-* and --lk-indigo-* custom property blocks straight
 * out of index.css, keyed by [data-theme="id"] and light/dark mode — the
 * exact source that drives every Tailwind slate/indigo utility class in
 * the app.
 */
function parseThemeStops(css: string): ThemeData {
  const data: ThemeData = {};
  let currentTheme: string | null = null;
  let currentMode: 'dark' | 'light' = 'dark';
  const selectorRe = /^\[data-theme="([a-z-]+)"\]/;

  for (const line of css.split('\n')) {
    const selMatch = line.match(selectorRe);
    if (selMatch) {
      currentTheme = selMatch[1];
      currentMode = line.includes('[data-mode="light"]') ? 'light' : 'dark';
      data[currentTheme] ??= { dark: {}, light: {} };
      continue;
    }
    const stopMatch = line.match(/^\s*--lk-(slate|indigo)-(\d+):\s*#([0-9a-fA-F]{6});/);
    if (stopMatch && currentTheme) {
      data[currentTheme][currentMode][`${stopMatch[1]}-${stopMatch[2]}`] = `#${stopMatch[3]}`;
    }
  }
  return data;
}

describe('Theme text contrast (WCAG AA)', () => {
  const css = readFileSync(CSS_PATH, 'utf8');
  const themes = parseThemeStops(css);
  const themeIds = Object.keys(themes);

  it('discovers all 13 themes in both dark and light mode', () => {
    expect(themeIds.length).toBe(13);
    for (const id of themeIds) {
      expect(Object.keys(themes[id].dark).length).toBeGreaterThan(0);
      expect(Object.keys(themes[id].light).length).toBeGreaterThan(0);
    }
  });

  // slate-400/500/600 are the muted-text tiers used throughout the app for
  // secondary text, timestamps, placeholders, and metadata. They must hit
  // 4.5:1 (WCAG AA normal text) against both slate-900 (card/surface bg)
  // and slate-950 (page bg), since components use both interchangeably.
  const mutedTextStops = ['slate-400', 'slate-500', 'slate-600'];
  const backgroundStops = ['slate-900', 'slate-950'];

  for (const themeId of [
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
  ]) {
    for (const mode of ['dark', 'light'] as const) {
      it(`${themeId} (${mode}): muted text tiers clear 4.5:1 against both surface and page backgrounds`, () => {
        const stops = themes[themeId][mode];
        for (const textStop of mutedTextStops) {
          for (const bgStop of backgroundStops) {
            const ratio = contrastRatio(stops[textStop], stops[bgStop]);
            expect(
              ratio,
              `${themeId} ${mode} ${textStop} (${stops[textStop]}) vs ${bgStop} (${stops[bgStop]}) = ${ratio.toFixed(2)}:1`
            ).toBeGreaterThanOrEqual(4.5);
          }
        }
      });
    }
  }

  it('primary text (slate-100) always clears 4.5:1 against the page background in every theme/mode', () => {
    for (const themeId of themeIds) {
      for (const mode of ['dark', 'light'] as const) {
        const stops = themes[themeId][mode];
        const ratio = contrastRatio(stops['slate-100'], stops['slate-950']);
        expect(ratio, `${themeId} ${mode} slate-100 vs slate-950`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
