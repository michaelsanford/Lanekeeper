import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  FolderPlus,
  Trash2,
  Plus,
  Check,
  ArrowRight,
  LayoutGrid
} from 'lucide-react';
import { SwimlaneIcon, TrafficLight } from '../icons/LaneIcons.js';
import { LaneMarker } from '../icons/LaneMarker.js';
import { LaneMarkerPickerModal } from './LaneMarkerPickerModal.js';
import type { ProjectMetadata, Lane, LaneType } from '../../types/index.js';
import {
  WORKFLOW_TEMPLATES,
  getWorkflowTemplate,
  type WorkflowTemplate
} from '../../utils/templates.js';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: ProjectMetadata;
  lanes: Lane[];
  projectsList: ProjectMetadata[];
  onUpdateMetadata: (updates: Partial<ProjectMetadata>) => void;
  onAddLane: (name: string, color?: string, type?: LaneType, wipLimit?: number, icon?: string) => void;
  onUpdateLane: (laneId: string, updates: Partial<Lane>) => void;
  onDeleteLane: (laneId: string) => void;
  onCreateProject: (name: string, prefix: string, templateId?: string) => void;
  onSwitchProject: (projectId: string, name?: string, prefix?: string) => void;
  onApplyTemplate?: (templateId: string) => void;
  onSeedSampleTasks?: () => void;
  initialTab?: 'general' | 'lanes' | 'projects';
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
  onApplyTemplate,
  onSeedSampleTasks,
  initialTab = 'lanes'
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'lanes' | 'projects'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // General tab state
  const [name, setName] = useState(metadata.name);
  const [prefix, setPrefix] = useState(metadata.prefix);
  const [generalSaved, setGeneralSaved] = useState(false);

  // Template state
  const activeTemplate = getWorkflowTemplate(metadata.templateId);
  const [isTemplateBrowserOpen, setIsTemplateBrowserOpen] = useState(false);
  const [templateConfirmTarget, setTemplateConfirmTarget] = useState<WorkflowTemplate | null>(null);
  const [selectedNewProjectTemplate, setSelectedNewProjectTemplate] = useState<string>('software-dev');
  const selectedTemplateObj = getWorkflowTemplate(selectedNewProjectTemplate);

  // New Lane state
  const [newLaneName, setNewLaneName] = useState('');
  const [newLaneColor, setNewLaneColor] = useState('#3b82f6');
  const [newLaneType, setNewLaneType] = useState<LaneType>('unstarted');
  const [newLaneWip, setNewLaneWip] = useState<string>('');
  const [newLaneIcon, setNewLaneIcon] = useState<string>('buoy');

  // Marker Picker state
  const [markerPickerTarget, setMarkerPickerTarget] = useState<{
    laneId: string;
    laneName: string;
    laneColor: string;
    currentIcon?: string;
  } | null>(null);

  // New Project state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPrefix, setNewProjectPrefix] = useState('');

  if (!isOpen) return null;

  const handleSelectMarker = (iconKey: string) => {
    if (!markerPickerTarget) return;
    if (markerPickerTarget.laneId === 'new') {
      setNewLaneIcon(iconKey);
    } else {
      onUpdateLane(markerPickerTarget.laneId, { icon: iconKey });
    }
  };

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
      onAddLane(newLaneName.trim(), newLaneColor, newLaneType, isNaN(wip!) ? undefined : wip, newLaneIcon);
      setNewLaneName('');
      setNewLaneWip('');
      setNewLaneIcon('buoy');
    }
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim() && newProjectPrefix.trim()) {
      onCreateProject(
        newProjectName.trim(),
        newProjectPrefix.trim().toUpperCase(),
        selectedNewProjectTemplate
      );
      setNewProjectName('');
      setNewProjectPrefix('');
      setSelectedNewProjectTemplate('software-dev');
      setActiveTab('lanes');
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
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'lanes'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SwimlaneIcon size={16} />
            <span>Workflow Lanes ({lanes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'projects'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Switch / New Project ({projectsList.length})
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

              {/* Demo Data Seed Action */}
              {onSeedSampleTasks && (
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">Sample Tasks</div>
                    <div className="text-xs text-slate-500">
                      Populate workflow lanes with initial sample tasks for local development.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSeedSampleTasks();
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                  >
                    Load Sample Tasks
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Tab 2: Workflow Lanes */}
          {activeTab === 'lanes' && (
            <div className="space-y-5 text-sm">
              {/* Project Scope & Template Banner */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-400 font-mono font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/60">
                      {metadata.prefix}
                    </span>
                    <span className="font-bold text-slate-100 text-sm">{metadata.name}</span>
                    <span className="text-xs text-slate-500 font-mono">({lanes.length} lanes)</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <span>Workflow Template:</span>
                    <span className="text-indigo-300 font-medium">{activeTemplate.name}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsTemplateBrowserOpen((o) => !o);
                    setTemplateConfirmTarget(null);
                  }}
                  className="flex items-center gap-1.5 text-xs bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-800/70 transition-colors font-medium self-start sm:self-auto cursor-pointer"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{isTemplateBrowserOpen ? 'Hide Templates' : 'Change Template / Preset'}</span>
                </button>
              </div>

              {/* Template Confirmation Dialog */}
              {templateConfirmTarget && (
                <div className="p-4 bg-amber-950/40 border border-amber-800/70 rounded-xl space-y-3 animate-fade-in text-sm">
                  <div className="font-semibold text-amber-200">
                    Apply &quot;{templateConfirmTarget.name}&quot; Template to {metadata.name}?
                  </div>
                  <p className="text-xs text-amber-300/80">
                    This will configure your board with {templateConfirmTarget.lanes.length} workflow lanes ({templateConfirmTarget.lanes.map((l) => l.name).join(', ')}). All existing tasks will be preserved and mapped to matching workflow stages.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onApplyTemplate?.(templateConfirmTarget.id);
                        setTemplateConfirmTarget(null);
                        setIsTemplateBrowserOpen(false);
                      }}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                      Yes, Apply Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateConfirmTarget(null)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Template Library Selection */}
              {isTemplateBrowserOpen && (
                <div className="p-4 bg-slate-950/90 rounded-xl border border-indigo-900/50 space-y-3.5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">Workflow Templates</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Select a curated workflow template for {metadata.name}.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {WORKFLOW_TEMPLATES.map((tmpl) => {
                      const isCurrent = (metadata.templateId || 'software-dev') === tmpl.id;
                      return (
                        <div
                          key={tmpl.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isCurrent
                              ? 'bg-indigo-950/30 border-indigo-600/70 shadow-sm'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <LaneMarker icon={tmpl.icon} color="#818cf8" size={16} />
                                <span className="font-semibold text-slate-100 text-sm">{tmpl.name}</span>
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {tmpl.category}
                                </span>
                                {isCurrent && (
                                  <span className="text-[11px] font-medium text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800/60">
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400">{tmpl.description}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setTemplateConfirmTarget(tmpl)}
                              disabled={isCurrent}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all shrink-0 cursor-pointer ${
                                isCurrent
                                  ? 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-sm active:scale-95'
                              }`}
                            >
                              {isCurrent ? 'Active Template' : 'Apply Template'}
                            </button>
                          </div>

                          {/* Lane Preview Chips */}
                          <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-800/70">
                            {tmpl.lanes.map((l) => (
                              <div
                                key={l.id}
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                              >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                                <LaneMarker icon={l.icon} color={l.color} size={11} />
                                <span>{l.name}</span>
                                {l.wipLimit && (
                                  <span className="text-[9px] font-mono text-slate-500">WIP:{l.wipLimit}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">
                  Configured Lanes ({lanes.length})
                </span>
                <span className="text-xs text-slate-500">
                  Custom column adjustments for this project
                </span>
              </div>

              {/* Existing Lanes List */}
              <div className="space-y-2.5">
                {lanes.map((lane) => (
                  <div
                    key={lane.id}
                    className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      {/* Color Picker & Marker */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={lane.color}
                          onChange={(e) => onUpdateLane(lane.id, { color: e.target.value })}
                          className="w-7 h-7 rounded-md bg-transparent cursor-pointer border-0 p-0"
                          title="Change lane color"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setMarkerPickerTarget({
                              laneId: lane.id,
                              laneName: lane.name,
                              laneColor: lane.color,
                              currentIcon: lane.icon
                            })
                          }
                          className="w-7 h-7 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/60 flex items-center justify-center transition-colors cursor-pointer"
                          title="Change swimlane marker glyph"
                        >
                          <LaneMarker icon={lane.icon} color={lane.color} size={16} />
                        </button>
                      </div>

                      {/* Lane Name */}
                      <input
                        type="text"
                        value={lane.name}
                        onChange={(e) => onUpdateLane(lane.id, { name: e.target.value })}
                        className="bg-slate-900 px-2.5 py-1.5 rounded-md text-slate-100 border border-slate-800 outline-none focus:border-indigo-500 flex-1 font-medium text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Flow Signal & Category Select */}
                      <div className="flex items-center gap-1.5">
                        <TrafficLight
                          state={
                            lane.type === 'completed'
                              ? 'green'
                              : lane.type === 'started'
                              ? 'amber'
                              : 'red'
                          }
                          size={16}
                          title={`Flow Signal: ${lane.type}`}
                        />
                        <select
                          value={lane.type}
                          onChange={(e) =>
                            onUpdateLane(lane.id, { type: e.target.value as LaneType })
                          }
                          className="bg-slate-900 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 text-xs cursor-pointer"
                          title="Workflow State Category"
                        >
                          <option value="backlog" className="bg-slate-900 text-slate-300">Backlog</option>
                          <option value="unstarted" className="bg-slate-900 text-slate-300">Unstarted</option>
                          <option value="started" className="bg-slate-900 text-slate-300">Started</option>
                          <option value="completed" className="bg-slate-900 text-slate-300">Completed</option>
                          <option value="cancelled" className="bg-slate-900 text-slate-300">Cancelled</option>
                        </select>
                      </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5 items-center">
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <input
                      type="color"
                      value={newLaneColor}
                      onChange={(e) => setNewLaneColor(e.target.value)}
                      className="w-8 h-8 rounded-md bg-transparent cursor-pointer border-0 p-0 flex-shrink-0"
                      title="Lane color"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setMarkerPickerTarget({
                          laneId: 'new',
                          laneName: newLaneName || 'New Lane',
                          laneColor: newLaneColor,
                          currentIcon: newLaneIcon
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/60 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                      title="Choose lane marker glyph"
                    >
                      <LaneMarker icon={newLaneIcon} color={newLaneColor} size={18} />
                    </button>
                    <input
                      type="text"
                      required
                      placeholder="Lane Name (e.g. QA)"
                      value={newLaneName}
                      onChange={(e) => setNewLaneName(e.target.value)}
                      className="w-full bg-slate-900 text-slate-100 px-3 py-2 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <TrafficLight
                      state={
                        newLaneType === 'completed'
                          ? 'green'
                          : newLaneType === 'started'
                          ? 'amber'
                          : 'red'
                      }
                      size={16}
                      title={`Flow Signal: ${newLaneType}`}
                    />
                    <select
                      value={newLaneType}
                      onChange={(e) => setNewLaneType(e.target.value as LaneType)}
                      className="w-full bg-slate-900 text-slate-300 px-2.5 py-2 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 text-xs cursor-pointer"
                    >
                      <option value="unstarted" className="bg-slate-900 text-slate-300">Unstarted</option>
                      <option value="started" className="bg-slate-900 text-slate-300">Started</option>
                      <option value="completed" className="bg-slate-900 text-slate-300">Completed</option>
                      <option value="backlog" className="bg-slate-900 text-slate-300">Backlog</option>
                      <option value="cancelled" className="bg-slate-900 text-slate-300">Cancelled</option>
                    </select>
                  </div>

                  <input
                    type="number"
                    placeholder="WIP (opt)"
                    value={newLaneWip}
                    onChange={(e) => setNewLaneWip(e.target.value)}
                    className="bg-slate-900 text-slate-200 px-2.5 py-2 rounded-lg border border-slate-800 outline-none text-center font-mono text-xs sm:col-span-1"
                  />

                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-3.5 rounded-lg transition-colors text-sm sm:col-span-1"
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
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200 text-sm">{proj.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                              {getWorkflowTemplate(proj.templateId).name}
                            </span>
                          </div>
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
                          className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors font-medium cursor-pointer"
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

                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase font-mono text-[11px]">
                    Workflow Template
                  </label>
                  <select
                    value={selectedNewProjectTemplate}
                    onChange={(e) => setSelectedNewProjectTemplate(e.target.value)}
                    className="w-full bg-slate-900 text-slate-200 px-3 py-2 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 text-xs cursor-pointer"
                  >
                    {WORKFLOW_TEMPLATES.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id} className="bg-slate-900 text-slate-200">
                        {tmpl.name} ({tmpl.lanes.length} lanes) - {tmpl.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Template Lane Preview */}
                {selectedTemplateObj && (
                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                    {selectedTemplateObj.lanes.map((l) => (
                      <div
                        key={l.id}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                        <LaneMarker icon={l.icon} color={l.color} size={11} />
                        <span>{l.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!newProjectName.trim() || !newProjectPrefix.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium py-2 rounded-lg transition-all cursor-pointer"
                >
                  Create and Open Project
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Swimlane Marker Palette Modal */}
      {markerPickerTarget && (
        <LaneMarkerPickerModal
          isOpen={!!markerPickerTarget}
          onClose={() => setMarkerPickerTarget(null)}
          currentIcon={markerPickerTarget.currentIcon}
          laneColor={markerPickerTarget.laneColor}
          laneName={markerPickerTarget.laneName}
          onSelectIcon={handleSelectMarker}
        />
      )}
    </div>
  );
};
