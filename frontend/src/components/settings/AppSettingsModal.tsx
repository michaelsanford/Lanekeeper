import React, { useState } from 'react';
import {
  Settings,
  X,
  Palette,
  Sun,
  Moon,
  Sliders,
  Check,
  RotateCcw,
  Clock
} from 'lucide-react';
import { type ThemeId, type ThemeMode, THEMES, getThemePreview } from '../../utils/themes.js';
import {
  useFeatureGate,
  getArchiveThresholdDays,
  setArchiveThresholdDays
} from '../../features/index.js';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeId;
  currentMode: ThemeMode;
  onSelectTheme: (themeId: ThemeId) => void;
  onSelectMode: (mode: ThemeMode) => void;
  initialTab?: 'themes' | 'features';
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  currentMode,
  onSelectTheme,
  onSelectMode,
  initialTab = 'themes'
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'features'>(initialTab);
  const { definitions, isEnabled, toggleFlag, resetFlags } = useFeatureGate();
  const [archiveDays, setArchiveDays] = useState<number>(() => getArchiveThresholdDays());

  if (!isOpen) return null;

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
              <h2 className="font-bold text-base text-slate-100">Preferences & System Settings</h2>
              <p className="text-xs text-slate-400">Manage appearance, colour schemes, and experimental feature flags.</p>
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
            onClick={() => setActiveTab('themes')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'themes'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Theme & Appearance</span>
          </button>
          <button
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
                  <h3 className="text-sm font-bold text-slate-100">Experimental & System Feature Gates</h3>
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
