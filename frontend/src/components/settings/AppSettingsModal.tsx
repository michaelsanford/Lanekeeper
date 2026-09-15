import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Palette,
  Sun,
  Moon,
  Sliders,
  Check,
  RotateCcw,
  Clock,
  User,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  GitCommit,
  AtSign,
  Key
} from 'lucide-react';
import { type ThemeId, type ThemeMode, THEMES, getThemePreview } from '../../utils/themes.js';
import {
  useFeatureGate,
  getArchiveThresholdDays,
  setArchiveThresholdDays
} from '../../features/index.js';
import type { UserProfile } from '../../types/index.js';
import { UserAvatar } from '../layout/UserAvatar.js';
import { getInitials, DEFAULT_SCOPES } from '../../hooks/useUserProfile.js';

export type AppSettingsTab = 'profile' | 'themes' | 'features';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeId;
  currentMode: ThemeMode;
  onSelectTheme: (themeId: ThemeId) => void;
  onSelectMode: (mode: ThemeMode) => void;
  initialTab?: AppSettingsTab;
  profile?: UserProfile;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
  onGenerateCliToken?: () => string;
  onOpenAuth?: () => void;
  onOpenHelp?: () => void;
}

const FALLBACK_PROFILE: UserProfile = {
  id: 'dev-user-01',
  email: 'michaelsanford@users.noreply.github.com',
  displayName: 'Michael Sanford',
  gitAuthorName: 'Michael Sanford',
  gitAuthorEmail: 'michaelsanford@users.noreply.github.com',
  defaultAssigneeHandle: 'michaelsanford',
  dailyFocusTargetMinutes: 240,
  mfaEnabled: false,
  provider: 'local',
  tokenScopes: DEFAULT_SCOPES,
  cliToken: 'lk_dev_seed_token'
};

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  currentMode,
  onSelectTheme,
  onSelectMode,
  initialTab = 'profile',
  profile = FALLBACK_PROFILE,
  onUpdateProfile,
  onGenerateCliToken: _onGenerateCliToken,
  onOpenAuth,
  onOpenHelp
}) => {
  const [activeTab, setActiveTab] = useState<AppSettingsTab>(initialTab);
  const { definitions, isEnabled, toggleFlag, resetFlags } = useFeatureGate();
  const [archiveDays, setArchiveDays] = useState<number>(() => getArchiveThresholdDays());

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const currentProfile = profile || FALLBACK_PROFILE;
  const initials = getInitials(currentProfile.displayName, currentProfile.email);
  const isCognito = currentProfile.provider === 'cognito';

  const handleSetArchiveDays = (days: number) => {
    setArchiveDays(days);
    setArchiveThresholdDays(days);
  };

  const handleResetFeatureFlags = () => {
    resetFlags();
    setArchiveDays(7);
    setArchiveThresholdDays(7);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">Preferences &amp; System Settings</h2>
              <p className="text-xs text-slate-400">Manage profile identity, appearance, and system feature gates.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile &amp; Account</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('themes')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'themes'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Theme &amp; Appearance</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'features'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Feature Gates</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Tab 0: Profile & Account */}
          {activeTab === 'profile' && (
            <div className="space-y-6 text-sm">
              {/* Identity & Avatar Overview */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-4">
                <UserAvatar
                  initials={initials}
                  displayName={currentProfile.displayName}
                  avatarUrl={currentProfile.avatarUrl}
                  isOnline={true}
                  mfaEnabled={currentProfile.mfaEnabled}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-100 text-base truncate">
                      {currentProfile.displayName || 'Michael Sanford'}
                    </h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isCognito
                          ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60'
                          : 'bg-indigo-950/70 text-indigo-400 border-indigo-800/60'
                      }`}
                    >
                      {isCognito ? 'AWS Cognito' : 'Local Dev Profile'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono truncate mt-0.5">
                    {currentProfile.email}
                  </div>
                </div>
              </div>

              {/* Developer Profile Details Form */}
              <div className="space-y-4">
                <div className="pb-1 border-b border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Personal Identity
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Display credentials used across the board and flight deck views.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={currentProfile.displayName}
                      onChange={(e) => onUpdateProfile?.({ displayName: e.target.value })}
                      placeholder="Michael Sanford"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={currentProfile.email}
                      onChange={(e) => onUpdateProfile?.({ email: e.target.value })}
                      placeholder="michaelsanford@users.noreply.github.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-colors font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Git & Assignment Metadata */}
              <div className="space-y-4">
                <div className="pb-1 border-b border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Git Author &amp; Assignment Configuration</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Controls Git commit signatures and mentions for ticket assignments.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Git Author Name
                    </label>
                    <input
                      type="text"
                      value={currentProfile.gitAuthorName || currentProfile.displayName}
                      onChange={(e) => onUpdateProfile?.({ gitAuthorName: e.target.value })}
                      placeholder="Michael Sanford"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Git Author Email
                    </label>
                    <input
                      type="email"
                      value={currentProfile.gitAuthorEmail || currentProfile.email}
                      onChange={(e) => onUpdateProfile?.({ gitAuthorEmail: e.target.value })}
                      placeholder="michaelsanford@users.noreply.github.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <AtSign className="w-3 h-3 text-indigo-400" />
                      <span>Assignee Handle</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono text-slate-500">@</span>
                      <input
                        type="text"
                        value={currentProfile.defaultAssigneeHandle || 'michaelsanford'}
                        onChange={(e) =>
                          onUpdateProfile?.({
                            defaultAssigneeHandle: e.target.value.replace(/^@/, '')
                          })
                        }
                        placeholder="michaelsanford"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-7 pr-3 py-2 text-xs text-slate-100 outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Handle defaults to your email username prefix, but may be customized to match your GitHub or Slack handle.
                </p>
              </div>

              {/* Personal Access Token (PAT) & lk CLI Link */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Personal Access Token (PAT) &amp; `lk` cli</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Personal access tokens, PowerShell/Bash export snippets, and scopes are managed in `lk` cli.
                    </p>
                  </div>
                  {onOpenHelp && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenHelp();
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      Open `lk` cli
                    </button>
                  )}
                </div>
              </div>

              {/* AWS Cognito Reconciliation & Security Section */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        AWS Cognito Authentication &amp; Multi-Factor Auth
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {isCognito
                        ? 'Your session is authenticated through AWS Cognito with time-based one-time password (TOTP) MFA enabled.'
                        : 'Currently operating in offline local developer mode. Connect AWS Cognito to enable encrypted cloud synchronization and MFA security.'}
                    </p>
                  </div>

                  {isCognito ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      MFA Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/60 shrink-0">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Local Dev
                    </span>
                  )}
                </div>

                {!isCognito && onOpenAuth && (
                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Authenticate with Cognito...
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 1: Theme & Appearance */}
          {activeTab === 'themes' && (
            <div className="space-y-5 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Coding Colour Schemes</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select display mode and an iconic palette to customize Lanekeeper.
                  </p>
                </div>

                {/* Mode Switcher: Light vs Dark */}
                <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onSelectMode('light')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      currentMode === 'light'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectMode('dark')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      currentMode === 'dark'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark Mode</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {THEMES.map((th) => {
                  const isActive = th.id === currentTheme;
                  const preview = getThemePreview(th, currentMode);
                  return (
                    <div
                      key={th.id}
                      onClick={() => onSelectTheme(th.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isActive
                          ? 'bg-indigo-950/40 border-indigo-500/70 shadow-lg ring-1 ring-indigo-500/50'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-slate-100 text-sm">{th.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{th.authorOrOrigin}</div>
                          </div>
                          {isActive && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/70">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{th.description}</p>
                      </div>

                      {/* 3-Color Swatch Strip */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/70">
                        <span className="text-[10px] uppercase font-mono text-slate-500">Palette:</span>
                        <div className="flex items-center -space-x-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-slate-700 shadow-sm"
                            style={{ backgroundColor: preview.bg }}
                            title={`Background: ${preview.bg}`}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-slate-700 shadow-sm"
                            style={{ backgroundColor: preview.surface }}
                            title={`Surface: ${preview.surface}`}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-slate-700 shadow-sm"
                            style={{ backgroundColor: preview.accent }}
                            title={`Accent: ${preview.accent}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Feature Gates */}
          {activeTab === 'features' && (
            <div className="space-y-6 text-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Experimental &amp; System Feature Gates</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Control modular capabilities, workflow automation, and feature rollouts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetFeatureFlags}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors font-medium cursor-pointer"
                  title="Reset all feature flags to defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              <div className="space-y-3.5">
                {definitions.map((feat) => {
                  const active = isEnabled(feat.id);
                  return (
                    <div
                      key={feat.id}
                      className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start justify-between gap-4 transition-colors hover:border-slate-700/80"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100 text-sm">{feat.name}</span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                              feat.stage === 'beta' || feat.stage === 'alpha'
                                ? 'bg-amber-950/70 text-amber-400 border-amber-800/60'
                                : feat.stage === 'preview'
                                ? 'bg-purple-950/70 text-purple-400 border-purple-800/60'
                                : 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60'
                            }`}
                          >
                            {feat.stage}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>

                        {/* Extra Configuration Options for Auto-Archive */}
                        {feat.id === 'doneLaneArchiving' && active && (
                          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-3">
                            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                            <div className="text-xs text-slate-300 flex-1">
                              Archive completed tasks older than:
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={1}
                                max={365}
                                value={archiveDays}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val) && val > 0) {
                                    handleSetArchiveDays(val);
                                  }
                                }}
                                className="w-16 bg-slate-900 border border-slate-700 text-slate-100 text-xs text-center py-1 px-1.5 rounded-lg outline-none focus:border-indigo-500 font-mono"
                              />
                              <span className="text-xs text-slate-400 font-mono">days</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => toggleFlag(feat.id)}
                        role="switch"
                        aria-checked={active}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                          active ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            active ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
