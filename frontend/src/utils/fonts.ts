export type FontId =
  | 'system'
  | 'inter'
  | 'jetbrains-mono'
  | 'fira-code'
  | 'ibm-plex-sans'
  | 'plus-jakarta-sans'
  | 'space-grotesk'
  | 'opendyslexic';

export type FontCategory = 'system' | 'google' | 'dyslexic';

export interface FontInfo {
  id: FontId;
  name: string;
  category: FontCategory;
  designerOrOrigin: string;
  description: string;
  fontFamily: string;
  monoFontFamily?: string;
  sampleText: string;
  badgeText: string;
}

export const FONTS: FontInfo[] = [
  {
    id: 'system',
    name: 'System Default',
    category: 'system',
    designerOrOrigin: 'OS Native (Apple / Microsoft / Linux)',
    description: 'Zero-overhead native operating system typography for seamless platform integration.',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    sampleText: 'LK-001 Native system performance and interface balance',
    badgeText: 'System Native'
  },
  {
    id: 'inter',
    name: 'Inter',
    category: 'google',
    designerOrOrigin: 'Rasmus Andersson',
    description: 'The standard for modern dev tools, Linear, and Figma. Engineered for high-density UI clarity.',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    sampleText: 'LK-108 Fix CRDT race condition in offline queue',
    badgeText: 'Google Web Font'
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    category: 'google',
    designerOrOrigin: 'JetBrains',
    description: 'Crafted for developers with 138-degree cutouts, clear 0/O distinctions, and authentic IDE vibes.',
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    monoFontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    sampleText: 'LK-204 git commit -m "feat: offline ID leasing"',
    badgeText: 'Google Web Font'
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    category: 'google',
    designerOrOrigin: 'Nikita Prokopov',
    description: 'Iconic developer monospace with programming ligatures and dense technical layouts.',
    fontFamily: "'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace",
    monoFontFamily: "'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace",
    sampleText: 'LK-310 const sync = async () => true;',
    badgeText: 'Google Web Font'
  },
  {
    id: 'ibm-plex-sans',
    name: 'IBM Plex Sans',
    category: 'google',
    designerOrOrigin: 'Mike Abbink & Bold Monday (IBM)',
    description: 'Engineered for IBM Carbon to balance machine precision with humanist clarity in complex consoles.',
    fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    sampleText: 'LK-412 Deploy Lambda handlers and DynamoDB GSI',
    badgeText: 'Google Web Font'
  },
  {
    id: 'plus-jakarta-sans',
    name: 'Plus Jakarta Sans',
    category: 'google',
    designerOrOrigin: 'Gumpita Rahayu (Tokotype)',
    description: 'Contemporary geometric sans tailored for modern developer SaaS platforms and agile boards.',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    sampleText: 'LK-519 Sprint review and release milestones',
    badgeText: 'Google Web Font'
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    category: 'google',
    designerOrOrigin: 'Florian Karsten',
    description: 'Neo-grotesque with monospace roots, giving a tech-forward personality suited for developer boards.',
    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    sampleText: 'LK-628 Dockerless local memory Map backend',
    badgeText: 'Google Web Font'
  },
  {
    id: 'opendyslexic',
    name: 'OpenDyslexic',
    category: 'dyslexic',
    designerOrOrigin: 'Abbie Gonzalez',
    description: 'Specialized typeface with weighted bottoms to anchor characters and prevent cognitive letter flipping.',
    fontFamily: "'OpenDyslexic', sans-serif",
    monoFontFamily: "'OpenDyslexic', monospace",
    sampleText: 'LK-735 Accessible Kanban cards and task flow',
    badgeText: 'Dyslexia Accessibility'
  }
];

export const FONT_STORAGE_KEY = 'lanekeeper_font';

let memoryFont: FontId = 'system';

export function getStoredFont(): FontId {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(FONT_STORAGE_KEY) as FontId | null;
      if (saved && FONTS.some((f) => f.id === saved)) {
        return saved;
      }
    } catch {}
  }
  return memoryFont;
}

export function applyFont(fontId: FontId): void {
  memoryFont = fontId;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-font', fontId);
    const font = FONTS.find((f) => f.id === fontId);
    if (font) {
      document.documentElement.style.setProperty('--lk-font-family', font.fontFamily);
      if (font.monoFontFamily) {
        document.documentElement.style.setProperty('--lk-font-mono', font.monoFontFamily);
      } else {
        document.documentElement.style.removeProperty('--lk-font-mono');
      }
    }
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(FONT_STORAGE_KEY, fontId);
    } catch {}
  }
}

export function getFontInfo(fontId: FontId): FontInfo {
  return FONTS.find((f) => f.id === fontId) || FONTS[0];
}
