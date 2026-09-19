export type ThemeId =
  | 'lanekeeper'
  | 'dracula'
  | 'tokyo-night'
  | 'catppuccin'
  | 'nord'
  | 'one-dark'
  | 'github-dark'
  | 'monokai'
  | 'gruvbox'
  | 'solarized'
  | 'campbell-powershell'
  | 'campbell'
  | 'roadworks';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  surface: string;
  border: string;
  accent: string;
  text: string;
}

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  authorOrOrigin: string;
  description: string;
  previewColors: ThemeColors & {
    dark: ThemeColors;
    light: ThemeColors;
  };
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'lanekeeper',
    name: 'Lanekeeper Midnight',
    authorOrOrigin: 'Default',
    description: 'Deep navy cyberpunk canvas with electric indigo and cyan accents',
    previewColors: {
      bg: '#090d16',
      surface: '#0f172a',
      border: '#1e293b',
      accent: '#6366f1',
      text: '#f8fafc',
      dark: {
        bg: '#090d16',
        surface: '#0f172a',
        border: '#1e293b',
        accent: '#6366f1',
        text: '#f8fafc'
      },
      light: {
        bg: '#f8fafc',
        surface: '#ffffff',
        border: '#e2e8f0',
        accent: '#4f46e5',
        text: '#090d16'
      }
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    authorOrOrigin: 'Zeno Rocha',
    description: 'Iconic gothic dark theme with purple, pink, and cyan highlights',
    previewColors: {
      bg: '#1e1f29',
      surface: '#282a36',
      border: '#44475a',
      accent: '#bd93f9',
      text: '#f8f8f2',
      dark: {
        bg: '#1e1f29',
        surface: '#282a36',
        border: '#44475a',
        accent: '#bd93f9',
        text: '#f8f8f2'
      },
      light: {
        bg: '#f8f8f2',
        surface: '#ffffff',
        border: '#e5e5ea',
        accent: '#9052ea',
        text: '#1e1f29'
      }
    }
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    authorOrOrigin: 'Enki',
    description: 'Neon nightlife of downtown Tokyo with deep indigo and vibrant pastel cyan',
    previewColors: {
      bg: '#16161e',
      surface: '#1a1b26',
      border: '#24283b',
      accent: '#7aa2f7',
      text: '#c0caf5',
      dark: {
        bg: '#16161e',
        surface: '#1a1b26',
        border: '#24283b',
        accent: '#7aa2f7',
        text: '#c0caf5'
      },
      light: {
        bg: '#e1e2e7',
        surface: '#ffffff',
        border: '#c4c8da',
        accent: '#3760bf',
        text: '#1a1b26'
      }
    }
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin Mocha',
    authorOrOrigin: 'Catppuccin Org',
    description: 'Soothing pastel palette with deep crust base and soft mauve accents',
    previewColors: {
      bg: '#11111b',
      surface: '#181825',
      border: '#313244',
      accent: '#cba6f7',
      text: '#cdd6f4',
      dark: {
        bg: '#11111b',
        surface: '#181825',
        border: '#313244',
        accent: '#cba6f7',
        text: '#cdd6f4'
      },
      light: {
        bg: '#eff1f5',
        surface: '#ffffff',
        border: '#ccd0da',
        accent: '#8839ef',
        text: '#202027'
      }
    }
  },
  {
    id: 'nord',
    name: 'Nord (Arctic)',
    authorOrOrigin: 'Arctic Ice Studio',
    description: 'Clean arctic north-bluish palette inspired by snow storms and aurora',
    previewColors: {
      bg: '#242933',
      surface: '#2e3440',
      border: '#434c5e',
      accent: '#88c0d0',
      text: '#eceff4',
      dark: {
        bg: '#242933',
        surface: '#2e3440',
        border: '#434c5e',
        accent: '#88c0d0',
        text: '#eceff4'
      },
      light: {
        bg: '#eceff4',
        surface: '#ffffff',
        border: '#d8dee9',
        accent: '#5e81ac',
        text: '#2e3440'
      }
    }
  },
  {
    id: 'one-dark',
    name: 'One Dark Pro',
    authorOrOrigin: 'Atom / VS Code',
    description: 'Revered Atom One Dark editor palette with balanced contrast',
    previewColors: {
      bg: '#1e222a',
      surface: '#282c34',
      border: '#353b45',
      accent: '#61afef',
      text: '#abb2bf',
      dark: {
        bg: '#1e222a',
        surface: '#282c34',
        border: '#353b45',
        accent: '#61afef',
        text: '#abb2bf'
      },
      light: {
        bg: '#fafafa',
        surface: '#ffffff',
        border: '#e5e5e6',
        accent: '#4078f2',
        text: '#1e2025'
      }
    }
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    authorOrOrigin: 'GitHub',
    description: 'Official GitHub dark mode canvas with crisp borders and focus blue',
    previewColors: {
      bg: '#0d1117',
      surface: '#161b22',
      border: '#30363d',
      accent: '#2f81f7',
      text: '#f0f6fc',
      dark: {
        bg: '#0d1117',
        surface: '#161b22',
        border: '#30363d',
        accent: '#2f81f7',
        text: '#f0f6fc'
      },
      light: {
        bg: '#f6f8fa',
        surface: '#ffffff',
        border: '#d0d7de',
        accent: '#0969da',
        text: '#1f2328'
      }
    }
  },
  {
    id: 'monokai',
    name: 'Monokai Pro',
    authorOrOrigin: 'Wimer Hazenberg',
    description: 'Distraction-free stone canvas with warm yellow, pink, and lime highlights',
    previewColors: {
      bg: '#19181a',
      surface: '#221f22',
      border: '#3a373a',
      accent: '#ffd866',
      text: '#fcfcfa',
      dark: {
        bg: '#19181a',
        surface: '#221f22',
        border: '#3a373a',
        accent: '#ffd866',
        text: '#fcfcfa'
      },
      light: {
        bg: '#f7f7f7',
        surface: '#ffffff',
        border: '#dedcd9',
        accent: '#d97706',
        text: '#1a1918'
      }
    }
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox Dark',
    authorOrOrigin: 'Pavel Pertsev',
    description: 'Retro groove warm dark palette with earthy orange, yellow, and green tones',
    previewColors: {
      bg: '#1d2021',
      surface: '#282828',
      border: '#3c3836',
      accent: '#fe8019',
      text: '#fbf1c7',
      dark: {
        bg: '#1d2021',
        surface: '#282828',
        border: '#3c3836',
        accent: '#fe8019',
        text: '#fbf1c7'
      },
      light: {
        bg: '#fbf1c7',
        surface: '#f9f5d7',
        border: '#ebdbb2',
        accent: '#af3a03',
        text: '#282828'
      }
    }
  },
  {
    id: 'solarized',
    name: 'Solarized Dark',
    authorOrOrigin: 'Ethan Schoonover',
    description: 'Scientifically calculated CIELAB precision palette with cyan and teal',
    previewColors: {
      bg: '#001e26',
      surface: '#002b36',
      border: '#073642',
      accent: '#268bd2',
      text: '#eee8d5',
      dark: {
        bg: '#001e26',
        surface: '#002b36',
        border: '#073642',
        accent: '#268bd2',
        text: '#eee8d5'
      },
      light: {
        bg: '#fdf6e3',
        surface: '#ffffff',
        border: '#eee8d5',
        accent: '#268bd2',
        text: '#002b36'
      }
    }
  },
  {
    id: 'campbell-powershell',
    name: 'Campbell PowerShell',
    authorOrOrigin: 'Microsoft / Windows Terminal',
    description: 'Official PowerShell console palette with royal navy background and Campbell ANSI highlights',
    previewColors: {
      bg: '#011738',
      surface: '#012456',
      border: '#0a3d87',
      accent: '#3b78ff',
      text: '#cccccc',
      dark: {
        bg: '#011738',
        surface: '#012456',
        border: '#0a3d87',
        accent: '#3b78ff',
        text: '#cccccc'
      },
      light: {
        bg: '#f0f5fb',
        surface: '#ffffff',
        border: '#cde0f5',
        accent: '#0066cc',
        text: '#011738'
      }
    }
  },
  {
    id: 'campbell',
    name: 'Campbell',
    authorOrOrigin: 'Microsoft / Windows Terminal',
    description: 'Default Windows Terminal dark console theme with crisp Campbell 16-color ANSI accents',
    previewColors: {
      bg: '#080808',
      surface: '#0c0c0c',
      border: '#2d2d2d',
      accent: '#3b78ff',
      text: '#cccccc',
      dark: {
        bg: '#080808',
        surface: '#0c0c0c',
        border: '#2d2d2d',
        accent: '#3b78ff',
        text: '#cccccc'
      },
      light: {
        bg: '#f3f3f3',
        surface: '#ffffff',
        border: '#d4d4d4',
        accent: '#005fb8',
        text: '#0c0c0c'
      }
    }
  },
  {
    id: 'roadworks',
    name: 'Roadworks',
    authorOrOrigin: 'Highway & Traffic Safety',
    description: 'Playful asphalt tarmac canvas with safety orange, highway yellow, reflective white, and traffic signal flow control',
    previewColors: {
      bg: '#111316',
      surface: '#181b20',
      border: '#292e37',
      accent: '#ea580c',
      text: '#ffffff',
      dark: {
        bg: '#111316',
        surface: '#181b20',
        border: '#292e37',
        accent: '#ea580c',
        text: '#ffffff'
      },
      light: {
        bg: '#f4f4f6',
        surface: '#ffffff',
        border: '#cbd5e1',
        accent: '#ea580c',
        text: '#111316'
      }
    }
  }
];

export function getThemePreview(theme: ThemeInfo, mode: ThemeMode): ThemeColors {
  if (mode === 'light' && theme.previewColors?.light) {
    return theme.previewColors.light;
  }
  return theme.previewColors?.dark || theme.previewColors;
}

const THEME_STORAGE_KEY = 'lanekeeper_theme';
const MODE_STORAGE_KEY = 'lanekeeper_theme_mode';

let memoryTheme: ThemeId = 'lanekeeper';
let memoryMode: ThemeMode = 'dark';

export function getStoredTheme(): ThemeId {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
      if (saved && THEMES.some((t) => t.id === saved)) {
        return saved;
      }
    } catch {}
  }
  return memoryTheme;
}

export function getStoredMode(): ThemeMode {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {}
  }
  return memoryMode;
}

export function applyTheme(themeId: ThemeId, mode: ThemeMode = getStoredMode()): void {
  memoryTheme = themeId;
  memoryMode = mode;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', themeId);
    document.documentElement.setAttribute('data-mode', mode);
    if (mode === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {}
  }
}

export {
  type FontId,
  type FontCategory,
  type FontInfo,
  FONTS,
  FONT_STORAGE_KEY,
  getStoredFont,
  applyFont,
  getFontInfo
} from './fonts.js';

