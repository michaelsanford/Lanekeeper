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

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  authorOrOrigin: string;
  description: string;
  previewColors: {
    bg: string;
    surface: string;
    border: string;
    accent: string;
    text: string;
  };
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'lanekeeper',
    name: 'Lanekeeper Midnight',
    authorOrOrigin: 'Default',
    description: 'Deep navy cyberpunk canvas with vibrant electric indigo and cyan accents',
    previewColors: {
      bg: '#090d16',
      surface: '#0f172a',
      border: '#1e293b',
      accent: '#6366f1',
      text: '#f8fafc'
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    authorOrOrigin: 'Zeno Rocha',
    description: 'The iconic gothic dark theme with purple, pink, and cyan highlights',
    previewColors: {
      bg: '#1e1f29',
      surface: '#282a36',
      border: '#44475a',
      accent: '#bd93f9',
      text: '#f8f8f2'
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
      text: '#c0caf5'
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
      text: '#cdd6f4'
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
      text: '#eceff4'
    }
  },
  {
    id: 'one-dark',
    name: 'One Dark Pro',
    authorOrOrigin: 'Atom / VS Code',
    description: 'The revered Atom One Dark editor palette with balanced contrast',
    previewColors: {
      bg: '#1e222a',
      surface: '#282c34',
      border: '#353b45',
      accent: '#61afef',
      text: '#abb2bf'
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
      text: '#f0f6fc'
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
      text: '#fcfcfa'
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
      text: '#fbf1c7'
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
      text: '#eee8d5'
    }
  },
  {
    id: 'campbell-powershell',
    name: 'Campbell PowerShell',
    authorOrOrigin: 'Microsoft / Windows Terminal',
    description: 'The official PowerShell console palette with royal navy background and Campbell ANSI highlights',
    previewColors: {
      bg: '#011738',
      surface: '#012456',
      border: '#0a3d87',
      accent: '#3b78ff',
      text: '#cccccc'
    }
  },
  {
    id: 'campbell',
    name: 'Campbell',
    authorOrOrigin: 'Microsoft / Windows Terminal',
    description: 'The default Windows Terminal dark console theme with crisp Campbell 16-color ANSI accents',
    previewColors: {
      bg: '#080808',
      surface: '#0c0c0c',
      border: '#2d2d2d',
      accent: '#3b78ff',
      text: '#cccccc'
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
      text: '#ffffff'
    }
  }
];

const THEME_STORAGE_KEY = 'lanekeeper_theme';
let memoryTheme: ThemeId = 'lanekeeper';

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

export function applyTheme(themeId: ThemeId): void {
  memoryTheme = themeId;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', themeId);
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {}
  }
}
