import React, { useState } from 'react';
import {
  Settings,
  X,
  FolderPlus,
  Trash2,
  Plus,
  Check,
  ArrowRight,
  Palette
} from 'lucide-react';
import type { ProjectMetadata, Lane, LaneType } from '../../types/index.js';
import { type ThemeId, THEMES } from '../../utils/themes.js';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: ProjectMetadata;
  lanes: Lane[];
  projectsList: ProjectMetadata[];
  onUpdateMetadata: (updates: Partial<ProjectMetadata>) => void;
  onAddLane: (name: string, color?: string, type?: LaneType, wipLimit?: number) => void;
  onUpdateLane: (laneId: string, updates: Partial<Lane>) => void;
  onDeleteLane: (laneId: string) => void;
  onCreateProject: (name: string, prefix: string) => void;
  onSwitchProject: (projectId: string, name?: string, prefix?: string) => void;
  currentTheme?: ThemeId;
  onSelectTheme?: (themeId: ThemeId) => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  metadata,
  lanes,
  projectsList,
  onUpdateMetadata,
  onAddLane,
  onUpdateLane,
  onDeleteLane,
  onCreateProject,
  onSwitchProject,
  currentTheme,
  onSelectTheme
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'lanes' | 'projects' | 'themes'>('general');

  // General tab state
  const [name, setName] = useState(metadata.name);
  const [prefix, setPrefix] = useState(metadata.prefix);
  const [generalSaved, setGeneralSaved] = useState(false);

  // New Lane state
  const [newLaneName, setNewLaneName] = useState('');
  const [newLaneColor, setNewLaneColor] = useState('#3b82f6');
  const [newLaneType, setNewLaneType] = useState<LaneType>('unstarted');
  const [newLaneWip, setNewLaneWip] = useState<string>('');

  // New Project state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPrefix, setNewProjectPrefix] = useState('');

  if (!isOpen) return null;

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMetadata({
      name: name.trim(),
      prefix: prefix.trim().toUpperCase()
    });
    setGeneralSaved(true);
    setTimeout(() => setGeneralSaved(false), 2000);
  };

  const handleAddLaneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLaneName.trim()) {
      const wip = newLaneWip ? parseInt(newLaneWip, 10) : undefined;
      onAddLane(newLaneName.trim(), newLaneColor, newLaneType, isNaN(wip!) ? undefined : wip);
      setNewLaneName('');
      setNewLaneWip('');
    }
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim() && newProjectPrefix.trim()) {
      onCreateProject(newProjectName.trim(), newProjectPrefix.trim().toUpperCase());
      setNewProjectName('');
      setNewProjectPrefix('');
      setActiveTab('general');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-indigo-400" />
            <h2 className="font-bold text-sm text-slate-100">Project Settings & Configuration</h2>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
              {metadata.prefix}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            General & Identifiers
          </button>
          <button
            onClick={() => setActiveTab('lanes')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'lanes'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Workflow Lanes ({lanes.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'projects'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Switch / New Project ({projectsList.length})
          </button>
          <button
            onClick={() => setActiveTab('themes')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'themes'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Theme & Appearance</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Tab 1: General */}
          {activeTab === 'general' && (
            <form onSubmit={handleGeneralSubmit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-mono text-xs">
                  Project Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 font-sans text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-mono text-xs">
                  Issue Key Prefix (e.g. LK, API, OPS)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  All new tasks created in this project will follow the format {prefix || 'KEY'}-101.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-mono text-xs">Project ID</label>
                <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-400">
                  {metadata.id}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-800">
                {generalSaved ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 font-medium text-sm">
                    <Check className="w-4 h-4" />
                    Settings saved
                  </span>
                ) : (
                  <div />
                )}
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 text-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Workflow Lanes */}
          {activeTab === 'lanes' && (
            <div className="space-y-5 text-sm">
              <p className="text-slate-400 text-sm">
                Configure your Kanban workflow columns, column colors, and WIP limits.
              </p>

              {/* Existing Lanes List */}
              <div className="space-y-2.5">
                {lanes.map((lane) => (
                  <div
                    key={lane.id}
                    className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      {/* Color Picker */}
                      <input
                        type="color"
                        value={lane.color}
                        onChange={(e) => onUpdateLane(lane.id, { color: e.target.value })}
                        className="w-7 h-7 rounded-md bg-transparent cursor-pointer border-0 p-0"
                      />

                      {/* Lane Name */}
                      <input
                        type="text"
                        value={lane.name}
                        onChange={(e) => onUpdateLane(lane.id, { name: e.target.value })}
                        className="bg-slate-900 px-2.5 py-1.5 rounded-md text-slate-100 border border-slate-800 outline-none focus:border-indigo-500 flex-1 font-medium text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Lane Type */}
                      <select
                        value={lane.type}
                        onChange={(e) =>
                          onUpdateLane(lane.id, { type: e.target.value as LaneType })
                        }
                        className="bg-slate-900 text-slate-300 px-2.5 py-1.5 rounded-md border border-slate-800 outline-none text-xs"
                      >
                        <option value="backlog">Backlog</option>
                        <option value="unstarted">Unstarted</option>
                        <option value="started">Started</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      {/* WIP Limit */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-mono text-xs">WIP:</span>
                        <input
                          type="number"
                          placeholder="No limit"
                          value={lane.wipLimit || ''}
                          onChange={(e) =>
                            onUpdateLane(lane.id, {
                              wipLimit: e.target.value ? parseInt(e.target.value, 10) : undefined
                            })
                          }
                          className="w-16 bg-slate-900 text-slate-200 px-2 py-1.5 rounded-md border border-slate-800 outline-none text-center font-mono text-xs"
                        />
                      </div>

                      {/* Delete Lane */}
                      {lanes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete lane "${lane.name}"? Cards will move to the first lane.`)) {
                              onDeleteLane(lane.id);
                            }
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Lane Form */}
              <form
                onSubmit={handleAddLaneSubmit}
                className="p-3.5 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl space-y-3"
              >
                <div className="flex items-center gap-2 font-semibold text-slate-300 text-sm">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Add Workflow Lane</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-center">
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <input
                      type="color"
                      value={newLaneColor}
                      onChange={(e) => setNewLaneColor(e.target.value)}
                      className="w-8 h-8 rounded-md bg-transparent cursor-pointer border-0 p-0 flex-shrink-0"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Lane Name (e.g. QA)"
                      value={newLaneName}
                      onChange={(e) => setNewLaneName(e.target.value)}
                      className="w-full bg-slate-900 text-slate-100 px-3 py-2 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 text-sm"
                    />
                  </div>

                  <select
                    value={newLaneType}
                    onChange={(e) => setNewLaneType(e.target.value as LaneType)}
                    className="bg-slate-900 text-slate-300 px-2.5 py-2 rounded-lg border border-slate-800 outline-none text-xs"
                  >
                    <option value="unstarted">Unstarted</option>
                    <option value="started">Started</option>
                    <option value="completed">Completed</option>
                    <option value="backlog">Backlog</option>
                  </select>

                  <input
                    type="number"
                    placeholder="WIP (opt)"
                    value={newLaneWip}
                    onChange={(e) => setNewLaneWip(e.target.value)}
                    className="bg-slate-900 text-slate-200 px-2.5 py-2 rounded-lg border border-slate-800 outline-none text-center font-mono text-xs"
                  />

                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-3.5 rounded-lg transition-colors text-sm"
                  >
                    Add Lane
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 3: Switch / Create Projects */}
          {activeTab === 'projects' && (
            <div className="space-y-5 text-sm">
              <p className="text-slate-400 text-sm">
                Switch between different project boards in your local workspace or provision a new one.
              </p>

              {/* Projects List */}
              <div className="space-y-2.5">
                {projectsList.map((proj) => {
                  const isActive = proj.id === metadata.id;
                  return (
                    <div
                      key={proj.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-indigo-950/40 border-indigo-500/50'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded border border-indigo-800/60">
                          {proj.prefix}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-200 text-sm">{proj.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{proj.id}</div>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="text-xs font-medium text-indigo-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => onSwitchProject(proj.id, proj.name, proj.prefix)}
                          className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors font-medium"
                        >
                          <span>Switch</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Create New Project Form */}
              <form
                onSubmit={handleCreateProjectSubmit}
                className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3"
              >
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <FolderPlus className="w-4 h-4 text-indigo-400" />
                  <span>Create New Project</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Project Name (e.g. Mobile App)"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="sm:col-span-2 bg-slate-900 text-slate-100 px-3 py-2 rounded-lg border border-slate-800 outline-none focus:border-indigo-500"
                  />

                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Key Prefix (e.g. MOB)"
                    value={newProjectPrefix}
                    onChange={(e) => setNewProjectPrefix(e.target.value.toUpperCase())}
                    className="bg-slate-900 text-slate-100 px-3 py-2 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newProjectName.trim() || !newProjectPrefix.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium py-2 rounded-lg transition-all"
                >
                  Create and Open Project
                </button>
              </form>
            </div>
          )}

          {/* Tab 4: Theme & Appearance */}
          {activeTab === 'themes' && (
            <div className="space-y-5 text-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Coding Colour Schemes</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select an iconic coding theme to customize Lanekeeper's full interface palette.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {THEMES.map((th) => {
                  const isActive = th.id === currentTheme;
                  return (
                    <div
                      key={th.id}
                      onClick={() => onSelectTheme?.(th.id)}
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
                            <div className="text-xs text-slate-400 font-mono">{th.authorOrOrigin}</div>
                          </div>
                          {isActive ? (
                            <span className="text-xs font-semibold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/60 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Active
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 font-mono">Select</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{th.description}</p>
                      </div>

                      {/* Swatch Previews */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5 flex-1">
                          <span
                            className="w-5 h-5 rounded-md border border-slate-700/80"
                            style={{ backgroundColor: th.previewColors.bg }}
                            title="Background"
                          />
                          <span
                            className="w-5 h-5 rounded-md border border-slate-700/80"
                            style={{ backgroundColor: th.previewColors.surface }}
                            title="Surface"
                          />
                          <span
                            className="w-5 h-5 rounded-md border border-slate-700/80"
                            style={{ backgroundColor: th.previewColors.border }}
                            title="Border"
                          />
                          <span
                            className="w-5 h-5 rounded-md border border-slate-700/80"
                            style={{ backgroundColor: th.previewColors.accent }}
                            title="Accent"
                          />
                          <span
                            className="w-5 h-5 rounded-md border border-slate-700/80"
                            style={{ backgroundColor: th.previewColors.text }}
                            title="Text"
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-500 uppercase">Palette</span>
                      </div>
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
