import React from 'react';
import {
  Layers,
  Zap,
  Target,
  Bell,
  BellRing,
  Wifi,
  WifiOff,
  HelpCircle
} from 'lucide-react';
import type { ProjectMetadata } from '../../types/index.js';

interface HeaderProps {
  metadata: ProjectMetadata;
  activeView: 'board' | 'flightdeck';
  onViewChange: (view: 'board' | 'flightdeck') => void;
  onOpenQuickCapture: () => void;
  onOpenHelp: () => void;
  isOnline: boolean;
  pushSubscribed: boolean;
  onTogglePush: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metadata,
  activeView,
  onViewChange,
  onOpenQuickCapture,
  onOpenHelp,
  isOnline,
  pushSubscribed,
  onTogglePush
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-base text-slate-100 tracking-tight">Lanekeeper</span>
            <span className="text-xs text-indigo-400 font-mono font-semibold bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/60">
              {metadata.prefix}
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* View Switcher: Board vs Flight Deck */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => onViewChange('board')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeView === 'board'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>
          <button
            onClick={() => onViewChange('flightdeck')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeView === 'flightdeck'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Focus Mode (Press F)"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Flight Deck</span>
            <kbd className="hidden sm:inline-block text-[10px] bg-indigo-950 px-1 rounded text-indigo-300 border border-indigo-700/50">
              F
            </kbd>
          </button>
        </div>
      </div>

      {/* Right: Quick Capture & Status Controls */}
      <div className="flex items-center gap-2">
        {/* Quick Capture Button */}
        <button
          onClick={onOpenQuickCapture}
          className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Capture</span>
          <kbd className="hidden md:inline-block text-[10px] bg-indigo-800/80 px-1.5 py-0.2 rounded text-indigo-100 font-mono">
            C
          </kbd>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Push Notification Toggle */}
        <button
          onClick={onTogglePush}
          title={pushSubscribed ? 'Push Notifications Enabled' : 'Enable Web Push Notifications'}
          className={`p-1.5 rounded-lg border transition-colors ${
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
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono border ${
            isOnline
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
              : 'bg-amber-950/40 text-amber-400 border-amber-800/50'
          }`}
        >
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Shortcuts Help */}
        <button
          onClick={onOpenHelp}
          title="Keyboard Shortcuts (?)"
          className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
