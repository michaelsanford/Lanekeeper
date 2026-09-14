import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  Bell,
  BellRing,
  Wifi,
  WifiOff,
  HelpCircle,
  Settings,
  Palette,
  Check,
  Table as TableIcon,
  Calendar as CalendarIcon,
  Sun,
  Moon
} from 'lucide-react';
import {
  LanekeeperLogo,
  SwimlaneIcon,
  LaneKeepIcon
} from '../icons/LaneIcons.js';
import type { ProjectMetadata } from '../../types/index.js';
import { type ThemeId, type ThemeMode, THEMES, getThemePreview } from '../../utils/themes.js';

export type ActiveView = 'board' | 'table' | 'calendar' | 'flightdeck';

interface HeaderProps {
  metadata: ProjectMetadata;
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenQuickCapture: () => void;
  onOpenHelp: () => void;
  onOpenProjectSettings: () => void;
  isOnline: boolean;
  pushSubscribed: boolean;
  onTogglePush: () => void;
  currentTheme: ThemeId;
  currentMode: ThemeMode;
  onSelectTheme: (themeId: ThemeId) => void;
  onSelectMode: (mode: ThemeMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  metadata,
  activeView,
  onViewChange,
  onOpenQuickCapture,
  onOpenHelp,
  onOpenProjectSettings,
  isOnline,
  pushSubscribed,
  onTogglePush,
  currentTheme,
  currentMode,
  onSelectTheme,
  onSelectMode
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isThemeMenuOpen]);
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Brand & Project Info */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <LanekeeperLogo size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-slate-100 tracking-tight">Lanekeeper</span>
        </div>

        {/* Project Selector & Settings Trigger */}
        <button
          onClick={onOpenProjectSettings}
          title="Project Settings & Workflow Lanes"
          className="flex items-center gap-2 bg-slate-950/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors text-sm"
        >
          <span className="text-xs text-indigo-400 font-mono font-bold bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/60">
            {metadata.prefix}
          </span>
          <span className="font-medium text-slate-200 hidden md:inline max-w-[140px] truncate">
            {metadata.name}
          </span>
          <Settings className="w-4 h-4 text-slate-400 ml-0.5" />
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* View Switcher: Board vs Table vs Calendar vs Flight Deck */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onViewChange('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeView === 'board'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Swimlane Board View"
          >
            <SwimlaneIcon size={16} />
            <span className="hidden md:inline">Board</span>
          </button>
          <button
            onClick={() => onViewChange('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeView === 'table'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Data Table View"
          >
            <TableIcon className="w-4 h-4" />
            <span className="hidden md:inline">Table</span>
          </button>
          <button
            onClick={() => onViewChange('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeView === 'calendar'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Calendar Schedule View"
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="hidden md:inline">Calendar</span>
          </button>
          <button
            onClick={() => onViewChange('flightdeck')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeView === 'flightdeck'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Keep to your lane focus mode (Press F)"
          >
            <LaneKeepIcon size={16} />
            <span className="hidden md:inline">Flight Deck</span>
            <kbd className="hidden lg:inline-block text-xs font-mono bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-300 border border-indigo-700/50">
              F
            </kbd>
          </button>
        </div>
      </div>

      {/* Right: Quick Capture & Status Controls */}
      <div className="flex items-center gap-2.5">
        {/* Quick Capture Button */}
        <button
          onClick={onOpenQuickCapture}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold px-3.5 py-2 rounded-lg shadow-sm shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Capture</span>
          <kbd className="hidden md:inline-block text-xs bg-indigo-800/80 px-1.5 py-0.5 rounded text-indigo-100 font-mono">
            C
          </kbd>
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Push Notification Toggle */}
        <button
          onClick={onTogglePush}
          title={pushSubscribed ? 'Push Notifications Enabled' : 'Enable Web Push Notifications'}
          className={`p-2 rounded-lg border transition-colors ${
            pushSubscribed
              ? 'bg-emerald-950/60 border-emerald-800/70 text-emerald-400 hover:bg-emerald-900/60'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          {pushSubscribed ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        </button>

        {/* Online / Offline Status Badge */}
        <div
          title={isOnline ? 'Connected to local & cloud sync' : 'Offline mode - changes saved locally'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-medium border ${
            isOnline
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
              : 'bg-amber-950/40 text-amber-400 border-amber-800/50'
          }`}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Coding Theme Selector */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setIsThemeMenuOpen((o) => !o)}
            title="Colour Scheme / Theme"
            className={`p-2 rounded-lg border transition-colors ${
              isThemeMenuOpen
                ? 'bg-indigo-950/80 border-indigo-700/70 text-indigo-300'
                : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Palette className="w-4 h-4" />
          </button>

          {isThemeMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1.5 z-50 animate-fade-in">
              {/* Display Mode Switcher (Light vs Dark) */}
              <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/40">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Display Mode
                </div>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => onSelectMode('light')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                      currentMode === 'light'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectMode('dark')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                      currentMode === 'dark'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              <div className="px-3.5 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono uppercase tracking-wider">
                <span>Colour Schemes</span>
                <span className="text-[11px] text-slate-500 lowercase">({THEMES.length} themes)</span>
              </div>

              <div className="max-h-80 overflow-y-auto py-1">
                {THEMES.map((th) => {
                  const isSelected = th.id === currentTheme;
                  const preview = getThemePreview(th, currentMode);
                  return (
                    <button
                      key={th.id}
                      onClick={() => {
                        onSelectTheme(th.id);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 flex items-center justify-between text-left transition-colors text-xs ${
                        isSelected
                          ? 'bg-indigo-950/60 text-indigo-400 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* 3-Color Swatch Preview */}
                        <div className="flex -space-x-1 items-center">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-700"
                            style={{ backgroundColor: preview.bg }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-700"
                            style={{ backgroundColor: preview.surface }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-700"
                            style={{ backgroundColor: preview.accent }}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-slate-100">{th.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{th.authorOrOrigin}</div>
                        </div>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Shortcuts Help */}
        <button
          onClick={onOpenHelp}
          title="Keyboard Shortcuts (?)"
          className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
