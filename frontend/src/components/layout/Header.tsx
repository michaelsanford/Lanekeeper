import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  Bell,
  BellRing,
  BellOff,
  Wifi,
  WifiOff,
  CloudOff,
  HelpCircle,
  Check,
  Table as TableIcon,
  Calendar as CalendarIcon,
  ChevronDown,
  Layers,
  FolderPlus,
  KeyRound
} from 'lucide-react';
import {
  LanekeeperLogo,
  SwimlaneIcon,
  LaneKeepIcon
} from '../icons/LaneIcons.js';
import type { ProjectMetadata, UserProfile } from '../../types/index.js';
import type { NetworkStatus } from '../../hooks/useNetworkStatus.js';
import type { ToolbarRevealMode } from '../../hooks/useToolbarPreferences.js';
import { getWorkflowTemplate } from '../../utils/templates.js';
import { UserAvatar } from './UserAvatar.js';
import { ProfileMenu } from './ProfileMenu.js';
import { getInitials } from '../../hooks/useUserProfile.js';

export type ActiveView = 'board' | 'table' | 'calendar' | 'flightdeck';

interface HeaderProps {
  metadata: ProjectMetadata;
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenQuickCapture: () => void;
  onOpenHelp: () => void;
  onOpenProjectSettings: (tab?: 'general' | 'lanes' | 'projects') => void;
  onOpenAppSettings: (tab?: 'profile' | 'themes' | 'features') => void;
  isOnline?: boolean;
  networkStatus?: NetworkStatus;
  revealMode?: ToolbarRevealMode;
  pushSubscribed: boolean;
  pushPermission?: NotificationPermission;
  onTogglePush: () => void;
  projectsList?: ProjectMetadata[];
  onSwitchProject?: (projectId: string, name?: string, prefix?: string) => void;
  profile?: UserProfile;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
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
  networkStatus,
  revealMode = 'balanced',
  pushSubscribed,
  pushPermission = 'default',
  onTogglePush,
  projectsList,
  onSwitchProject,
  profile,
  onOpenAuth,
  onSignOut
}) => {
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);

  const effectiveStatus: NetworkStatus = networkStatus || (isOnline === false ? 'offline' : 'online');

  const currentProfile: UserProfile = profile || {
    id: 'dev-user-01',
    email: 'michaelsanford@users.noreply.github.com',
    displayName: 'Michael Sanford',
    gitAuthorName: 'Michael Sanford',
    gitAuthorEmail: 'michaelsanford@users.noreply.github.com',
    defaultAssigneeHandle: 'michaelsanford',
    dailyFocusTargetMinutes: 240,
    mfaEnabled: false,
    provider: 'local',
    cliToken: 'lk_dev_seed_token'
  };
  const initials = getInitials(currentProfile.displayName, currentProfile.email);

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
        {/* Brand Icon with slide-out name on hover (always visible in expanded mode) */}
        <div
          className="group flex items-center cursor-pointer select-none"
          title="Lanekeeper"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
            <LanekeeperLogo size={18} className="text-white" />
          </div>
          <div
            className={
              revealMode === 'expanded'
                ? 'max-w-[120px] opacity-100 ml-2.5 transition-all duration-300 ease-out whitespace-nowrap'
                : 'max-w-0 overflow-hidden opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out whitespace-nowrap'
            }
          >
            <span className="font-semibold text-sm text-slate-300 tracking-tight">Lanekeeper</span>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-0.5 hidden sm:block" />

        {/* Prominent Project Display & Switcher (Slide-reveal in zen mode) */}
        <div className="relative" ref={projectMenuRef}>
          <button
            onClick={() => setIsProjectMenuOpen((o) => !o)}
            title={`Project: ${metadata.name} (${metadata.prefix}) - Click to switch`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/70 border border-transparent hover:border-slate-800 transition-all text-left group/proj cursor-pointer select-none"
          >
            <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/90 px-2 py-0.5 rounded border border-indigo-800/70 shadow-sm group-hover/proj:border-indigo-600 transition-colors shrink-0">
              {metadata.prefix}
            </span>
            <div
              className={
                revealMode === 'zen'
                  ? 'max-w-0 overflow-hidden opacity-0 group-hover/proj:max-w-[320px] group-hover/proj:opacity-100 group-hover/proj:ml-1 transition-all duration-300 ease-out whitespace-nowrap flex items-center gap-1.5'
                  : 'flex items-center gap-1.5 ml-1'
              }
            >
              <span className="font-bold text-base sm:text-lg text-slate-100 tracking-tight max-w-[160px] sm:max-w-[240px] md:max-w-[320px] truncate group-hover/proj:text-white transition-colors">
                {metadata.name}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover/proj:text-slate-200 transition-transform shrink-0 ${
                  isProjectMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
            {revealMode === 'zen' && (
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover/proj:text-slate-200 transition-transform shrink-0 group-hover/proj:hidden ${
                  isProjectMenuOpen ? 'rotate-180' : ''
                }`}
              />
            )}
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
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
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
            className={`group/view-btn flex items-center ${
              (activeView === 'board' && revealMode === 'balanced') || revealMode === 'expanded' ? 'px-3 py-1.5' : 'px-2.5 py-1.5'
            } rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeView === 'board'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
            title="Swimlane Board View"
          >
            <SwimlaneIcon size={16} className="shrink-0" />
            <span
              className={
                revealMode === 'expanded'
                  ? 'ml-1.5 hidden md:inline font-medium'
                  : revealMode === 'balanced' && activeView === 'board'
                  ? 'ml-1.5 inline font-medium'
                  : 'max-w-0 overflow-hidden opacity-0 group-hover/view-btn:max-w-[100px] group-hover/view-btn:opacity-100 group-hover/view-btn:ml-1.5 transition-all duration-300 ease-out whitespace-nowrap font-medium'
              }
            >
              Board
            </span>
          </button>
          <button
            onClick={() => onViewChange('table')}
            className={`group/view-btn flex items-center ${
              (activeView === 'table' && revealMode === 'balanced') || revealMode === 'expanded' ? 'px-3 py-1.5' : 'px-2.5 py-1.5'
            } rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeView === 'table'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
            title="Data Table View"
          >
            <TableIcon className="w-4 h-4 shrink-0" />
            <span
              className={
                revealMode === 'expanded'
                  ? 'ml-1.5 hidden md:inline font-medium'
                  : revealMode === 'balanced' && activeView === 'table'
                  ? 'ml-1.5 inline font-medium'
                  : 'max-w-0 overflow-hidden opacity-0 group-hover/view-btn:max-w-[100px] group-hover/view-btn:opacity-100 group-hover/view-btn:ml-1.5 transition-all duration-300 ease-out whitespace-nowrap font-medium'
              }
            >
              Table
            </span>
          </button>
          <button
            onClick={() => onViewChange('calendar')}
            className={`group/view-btn flex items-center ${
              (activeView === 'calendar' && revealMode === 'balanced') || revealMode === 'expanded' ? 'px-3 py-1.5' : 'px-2.5 py-1.5'
            } rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeView === 'calendar'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
            title="Calendar Schedule View"
          >
            <CalendarIcon className="w-4 h-4 shrink-0" />
            <span
              className={
                revealMode === 'expanded'
                  ? 'ml-1.5 hidden md:inline font-medium'
                  : revealMode === 'balanced' && activeView === 'calendar'
                  ? 'ml-1.5 inline font-medium'
                  : 'max-w-0 overflow-hidden opacity-0 group-hover/view-btn:max-w-[100px] group-hover/view-btn:opacity-100 group-hover/view-btn:ml-1.5 transition-all duration-300 ease-out whitespace-nowrap font-medium'
              }
            >
              Calendar
            </span>
          </button>
          <button
            onClick={() => onViewChange('flightdeck')}
            className={`group/view-btn flex items-center ${
              (activeView === 'flightdeck' && revealMode === 'balanced') || revealMode === 'expanded' ? 'px-3 py-1.5' : 'px-2.5 py-1.5'
            } rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeView === 'flightdeck'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
            title="Keep to your lane focus mode (Press F)"
          >
            <LaneKeepIcon size={16} className="shrink-0" />
            <span
              className={
                revealMode === 'expanded'
                  ? 'ml-1.5 hidden md:inline font-medium'
                  : revealMode === 'balanced' && activeView === 'flightdeck'
                  ? 'ml-1.5 inline font-medium'
                  : 'max-w-0 overflow-hidden opacity-0 group-hover/view-btn:max-w-[100px] group-hover/view-btn:opacity-100 group-hover/view-btn:ml-1.5 transition-all duration-300 ease-out whitespace-nowrap font-medium'
              }
            >
              Flight Deck
            </span>
            {((activeView === 'flightdeck' && revealMode === 'balanced') || revealMode === 'expanded') && (
              <kbd className="hidden lg:inline-block text-xs font-mono bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-300 border border-indigo-700/50 ml-1.5">
                F
              </kbd>
            )}
          </button>
        </div>
      </div>

      {/* Right: Quick Capture & Status Controls */}
      <div className="flex items-center gap-2.5">
        {/* Quick Capture Button (Slide-reveal in balanced and zen modes) */}
        <button
          onClick={onOpenQuickCapture}
          className={`group/capture h-9 flex items-center bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold rounded-lg shadow-sm shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer select-none ${
            revealMode === 'expanded' ? 'px-3.5' : 'px-2.5'
          }`}
          title="Quick Capture Task (C)"
        >
          <Zap className="w-4 h-4 fill-current shrink-0" />
          <div
            className={
              revealMode === 'expanded'
                ? 'flex items-center gap-1.5 ml-1.5 whitespace-nowrap'
                : 'max-w-0 overflow-hidden opacity-0 group-hover/capture:max-w-[110px] group-hover/capture:opacity-100 group-hover/capture:ml-1.5 transition-all duration-300 ease-out whitespace-nowrap flex items-center gap-1.5'
            }
          >
            <span>Capture</span>
            <kbd className="hidden md:inline-block text-xs bg-indigo-800/80 px-1.5 py-0.5 rounded text-indigo-100 font-mono">
              C
            </kbd>
          </div>
        </button>

        <div className="h-5 w-px bg-slate-800 mx-0.5" />

        {/* Push Notification Toggle (Icon only resting, expands on hover in balanced/zen) */}
        <button
          onClick={onTogglePush}
          title={
            pushSubscribed
              ? 'Push Notifications: Enabled'
              : pushPermission === 'denied'
              ? 'Push Notifications: Blocked / Denied by browser'
              : 'Enable Web Push Notifications'
          }
          className={`group/notify h-9 px-2.5 flex items-center rounded-lg border transition-all duration-300 ease-out cursor-pointer select-none ${
            pushSubscribed
              ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/50'
              : pushPermission === 'denied'
              ? 'bg-rose-950/50 border-rose-800/60 text-rose-400 hover:bg-rose-900/50'
              : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          }`}
        >
          {pushSubscribed ? (
            <BellRing className="w-4 h-4 shrink-0" />
          ) : pushPermission === 'denied' ? (
            <BellOff className="w-4 h-4 shrink-0" />
          ) : (
            <Bell className="w-4 h-4 shrink-0" />
          )}
          <span
            className={
              revealMode === 'expanded'
                ? 'ml-1.5 whitespace-nowrap text-xs font-mono font-medium'
                : 'max-w-0 overflow-hidden opacity-0 group-hover/notify:max-w-[140px] group-hover/notify:opacity-100 group-hover/notify:ml-1.5 transition-all duration-300 ease-out whitespace-nowrap text-xs font-mono font-medium'
            }
          >
            {pushSubscribed
              ? 'Notifications: On'
              : pushPermission === 'denied'
              ? 'Notifications: Denied'
              : 'Notifications: Off'}
          </span>
        </button>

        {/* Online / Offline Status Badge (Icon only resting, expands on hover in balanced/zen) */}
        <div
          title={
            effectiveStatus === 'online'
              ? 'Connected to local & cloud sync'
              : effectiveStatus === 'server_offline'
              ? 'Server unreachable - changes saved locally and will sync when server reconnects'
              : 'Offline mode - changes saved locally'
          }
          className={`group/badge h-9 px-2.5 flex items-center rounded-lg border transition-all duration-300 ease-out cursor-default select-none ${
            effectiveStatus === 'online'
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50 hover:bg-emerald-950/60'
              : 'bg-amber-950/40 text-amber-400 border-amber-800/50 hover:bg-amber-950/60'
          }`}
        >
          {effectiveStatus === 'online' ? (
            <Wifi className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : effectiveStatus === 'server_offline' ? (
            <CloudOff className="w-4 h-4 shrink-0 text-amber-400" />
          ) : (
            <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
          )}
          <span
            className={
              revealMode === 'expanded'
                ? 'ml-1.5 whitespace-nowrap text-xs font-mono font-medium'
                : 'max-w-0 overflow-hidden opacity-0 group-hover/badge:max-w-[140px] group-hover/badge:opacity-100 group-hover/badge:ml-1.5 transition-all duration-300 ease-out whitespace-nowrap text-xs font-mono font-medium'
            }
          >
            {effectiveStatus === 'online'
              ? 'Online'
              : effectiveStatus === 'server_offline'
              ? 'Server Offline'
              : 'Offline'}
          </span>
        </div>

        {/* User Profile Avatar & Dropdown Menu */}
        <div className="relative flex items-center h-9">
          <UserAvatar
            initials={initials}
            displayName={currentProfile.displayName}
            avatarUrl={currentProfile.avatarUrl}
            isOnline={effectiveStatus === 'online'}
            networkStatus={effectiveStatus}
            mfaEnabled={currentProfile.mfaEnabled}
            size="md"
            onClick={() => setIsProfileMenuOpen((o) => !o)}
            title="Preferences & System Settings"
          />

          <ProfileMenu
            isOpen={isProfileMenuOpen}
            onClose={() => setIsProfileMenuOpen(false)}
            profile={currentProfile}
            networkStatus={effectiveStatus}
            isOnline={effectiveStatus === 'online'}
            onOpenAppSettings={onOpenAppSettings}
            onOpenHelp={onOpenHelp}
            onOpenAuth={onOpenAuth}
            onSignOut={onSignOut}
          />
        </div>

        {/* Shortcuts Help */}
        <button
          onClick={onOpenHelp}
          title="Keyboard Shortcuts (?)"
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
