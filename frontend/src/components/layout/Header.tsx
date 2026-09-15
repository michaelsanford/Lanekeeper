import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  Bell,
  BellRing,
  Wifi,
  WifiOff,
  HelpCircle,
  Settings,
  Check,
  Table as TableIcon,
  Calendar as CalendarIcon,
  ChevronDown,
  Layers,
  FolderPlus
} from 'lucide-react';
import {
  LanekeeperLogo,
  SwimlaneIcon,
  LaneKeepIcon
} from '../icons/LaneIcons.js';
import type { ProjectMetadata } from '../../types/index.js';
import { getWorkflowTemplate } from '../../utils/templates.js';

export type ActiveView = 'board' | 'table' | 'calendar' | 'flightdeck';

interface HeaderProps {
  metadata: ProjectMetadata;
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenQuickCapture: () => void;
  onOpenHelp: () => void;
  onOpenProjectSettings: (tab?: 'general' | 'lanes' | 'projects') => void;
  onOpenAppSettings: () => void;
  isOnline: boolean;
  pushSubscribed: boolean;
  onTogglePush: () => void;
  projectsList?: ProjectMetadata[];
  onSwitchProject?: (projectId: string, name?: string, prefix?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  metadata,
  activeView,
  onViewChange,
  onOpenQuickCapture,
  onOpenHelp,
  onOpenProjectSettings,
  onOpenAppSettings,
  isOnline,
  pushSubscribed,
  onTogglePush,
  projectsList,
  onSwitchProject
}) => {
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    };
    if (isProjectMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProjectMenuOpen]);
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Brand & Project Info */}
      <div className="flex items-center gap-3">
        {/* Brand Icon with slide-out name on hover */}
        <div
          className="group flex items-center cursor-pointer select-none"
          title="Lanekeeper"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
            <LanekeeperLogo size={18} className="text-white" />
          </div>
          <div className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out whitespace-nowrap">
            <span className="font-semibold text-sm text-slate-300 tracking-tight">Lanekeeper</span>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-0.5 hidden sm:block" />

        {/* Prominent Project Display & Switcher */}
        <div className="relative" ref={projectMenuRef}>
          <button
            onClick={() => setIsProjectMenuOpen((o) => !o)}
            title={`Project: ${metadata.name} (${metadata.prefix}) - Click to switch`}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/70 border border-transparent hover:border-slate-800 transition-all text-left group/proj cursor-pointer"
          >
            <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/90 px-2 py-0.5 rounded border border-indigo-800/70 shadow-sm group-hover/proj:border-indigo-600 transition-colors">
              {metadata.prefix}
            </span>
            <span className="font-bold text-base sm:text-lg text-slate-100 tracking-tight max-w-[160px] sm:max-w-[240px] md:max-w-[320px] truncate group-hover/proj:text-white transition-colors">
              {metadata.name}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover/proj:text-slate-200 transition-transform ${
                isProjectMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isProjectMenuOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1.5 z-50 animate-fade-in">
              <div className="px-3.5 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono uppercase tracking-wider">
                <span>Workspaces</span>
                <span className="text-[11px] text-slate-500 lowercase">({projectsList?.length || 1} projects)</span>
              </div>

              <div className="max-h-60 overflow-y-auto py-1">
                {(projectsList || [metadata]).map((proj) => {
                  const isSelected = proj.id === metadata.id;
                  const tmpl = getWorkflowTemplate(proj.templateId);
                  return (
                    <button
                      key={proj.id}
                      onClick={() => {
                        if (!isSelected && onSwitchProject) {
                          onSwitchProject(proj.id, proj.name, proj.prefix);
                        }
                        setIsProjectMenuOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 flex items-center justify-between text-left transition-colors text-xs ${
                        isSelected
                          ? 'bg-indigo-950/60 text-indigo-400 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/70 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/90 px-1.5 py-0.5 rounded border border-indigo-800/70">
                          {proj.prefix}
                        </span>
                        <div>
                          <div className="font-medium text-slate-100">{proj.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{tmpl.name}</div>
                        </div>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1.5 border-t border-slate-800/80 px-1 space-y-0.5">
                <button
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    onOpenProjectSettings('lanes');
                  }}
                  className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Workflow Lanes & Templates...</span>
                </button>
                <button
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    onOpenProjectSettings('projects');
                  }}
                  className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Switch / New Project...</span>
                </button>
                <button
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    onOpenProjectSettings('general');
                  }}
                  className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Project Identifiers & Key...</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-800 mx-0.5 hidden sm:block" />

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

        {/* App Preferences & Feature Gates (Theme & Settings) */}
        <button
          onClick={onOpenAppSettings}
          title="Preferences & Feature Gates (Themes & Settings)"
          className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

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
