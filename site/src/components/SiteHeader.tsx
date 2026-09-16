import React, { useState } from 'react';
import { ExternalLink, Sun, Moon } from 'lucide-react';
import { LanekeeperLogo } from '../../../frontend/src/components/icons/LaneIcons.js';
import { useTheme } from '../../../frontend/src/hooks/useTheme.js';

const REPO_URL = 'https://github.com/michaelsanford/Lanekeeper';

interface SiteHeaderProps {
  theme: ReturnType<typeof useTheme>;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({ theme }) => {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-5 flex items-center justify-between sticky top-0 z-30 select-none">
      <a href="#top" className="flex items-center gap-2.5 group">
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
          <LanekeeperLogo size={18} className="text-white" />
        </span>
        <span className="font-bold text-base sm:text-lg text-slate-100 tracking-tight group-hover:text-white transition-colors">
          Lanekeeper
        </span>
      </a>

      <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
        <a href="#board" className="px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors">
          Board
        </a>
        <a href="#capture" className="px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors">
          Quick Capture
        </a>
        <a href="#terminal" className="px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors">
          CLI
        </a>
        <a href="#themes" className="px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors">
          Themes
        </a>
        <a href="#templates" className="px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors">
          Templates
        </a>
      </nav>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={theme.toggleMode}
          aria-label={theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors cursor-pointer"
        >
          {theme.mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-800 bg-slate-950/80 text-slate-300 hover:text-white hover:border-slate-700 text-sm font-medium transition-colors"
        >
          <ExternalLink size={16} />
          GitHub
        </a>
        <button
          type="button"
          onClick={() => setNavOpen((v) => !v)}
          aria-expanded={navOpen}
          aria-label="Toggle navigation"
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950/80 text-slate-400 cursor-pointer"
        >
          <span className="sr-only">Menu</span>
          <div className="w-4 flex flex-col gap-1">
            <span className="h-px bg-current" />
            <span className="h-px bg-current" />
            <span className="h-px bg-current" />
          </div>
        </button>
      </div>

      {navOpen ? (
        <nav className="absolute top-16 left-0 right-0 bg-slate-900 border-b border-slate-800 flex flex-col p-2 md:hidden animate-fade-in">
          {[
            ['#board', 'Board'],
            ['#capture', 'Quick Capture'],
            ['#terminal', 'CLI'],
            ['#themes', 'Themes'],
            ['#templates', 'Templates']
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={() => setNavOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800/60 transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
};
