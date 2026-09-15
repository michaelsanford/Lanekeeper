import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Play,
  Square,
  Plus,
  AlertCircle,
  Archive,
  RotateCcw
} from 'lucide-react';
import type { Task, Lane, TaskPriority } from '../../types/index.js';
import { LaneMarker } from '../icons/LaneMarker.js';
import { useFeatureGate } from '../../features/index.js';

interface TableViewProps {
  tasks: Task[];
  lanes: Lane[];
  onSelectTask: (task: Task) => void;
  onToggleTimer: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onAddTask: (task: { title: string; laneId: string; priority?: TaskPriority; dueDate?: string }) => void;
  enableTimeTracking?: boolean;
  onUnarchiveTask?: (taskId: string) => void;
}

type SortField = 'key' | 'title' | 'lane' | 'priority' | 'dueDate' | 'estimate' | 'timeSpent';
type SortDirection = 'asc' | 'desc';

const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
  none: 0
};

const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string; border: string }> = {
  urgent: { bg: 'bg-rose-950/60', text: 'text-rose-400', border: 'border-rose-800/60' },
  high: { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-800/60' },
  medium: { bg: 'bg-blue-950/60', text: 'text-blue-400', border: 'border-blue-800/60' },
  low: { bg: 'bg-slate-900/60', text: 'text-slate-400', border: 'border-slate-800/60' },
  none: { bg: 'bg-transparent', text: 'text-slate-500', border: 'border-transparent' }
};

export const TableView: React.FC<TableViewProps> = ({
  tasks,
  lanes,
  onSelectTask,
  onToggleTimer,
  onUpdateTask,
  onAddTask,
  enableTimeTracking,
  onUnarchiveTask
}) => {
  const { isEnabled } = useFeatureGate();
  const isTimeTrackingEnabled = enableTimeTracking ?? isEnabled('timeTracking');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLaneFilter, setSelectedLaneFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [sortField, setSortField] = useState<SortField>('key');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [quickTitle, setQuickTitle] = useState('');

  const laneMap = useMemo(() => {
    const map = new Map<string, Lane>();
    for (const lane of lanes) {
      map.set(lane.id, lane);
    }
    return map;
  }, [lanes]);

  const defaultLaneId = lanes[0]?.id || 'triage';

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const archivedCount = useMemo(() => tasks.filter((t) => t.archived).length, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Archive filter
      if (showArchived) {
        if (!task.archived) return false;
      } else {
        if (task.archived) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesKey = task.key.toLowerCase().includes(q);
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesTags = task.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesKey && !matchesTitle && !matchesTags) {
          return false;
        }
      }

      // Lane filter
      if (selectedLaneFilter !== 'all' && task.laneId !== selectedLaneFilter) {
        return false;
      }

      // Priority filter
      if (selectedPriorityFilter !== 'all' && task.priority !== selectedPriorityFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedLaneFilter, selectedPriorityFilter, showArchived]);

  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'key': {
          // Compare numeric part of keys if available (e.g. LK-42 vs LK-10)
          const numA = parseInt(a.key.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.key.replace(/\D/g, ''), 10) || 0;
          comparison = numA - numB;
          break;
        }
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'lane': {
          const laneA = laneMap.get(a.laneId)?.name || '';
          const laneB = laneMap.get(b.laneId)?.name || '';
          comparison = laneA.localeCompare(laneB);
          break;
        }
        case 'priority':
          comparison = (PRIORITY_WEIGHTS[a.priority] || 0) - (PRIORITY_WEIGHTS[b.priority] || 0);
          break;
        case 'dueDate': {
          const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          comparison = timeA - timeB;
          break;
        }
        case 'estimate':
          comparison = (a.estimateMinutes || 0) - (b.estimateMinutes || 0);
          break;
        case 'timeSpent':
          comparison = (a.timeSpentSeconds || 0) - (b.timeSpentSeconds || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredTasks, sortField, sortDirection, laneMap]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTitle.trim()) {
      onAddTask({
        title: quickTitle.trim(),
        laneId: selectedLaneFilter !== 'all' ? selectedLaneFilter : defaultLaneId,
        priority: selectedPriorityFilter !== 'all' ? (selectedPriorityFilter as TaskPriority) : 'none'
      });
      setQuickTitle('');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
    );
  };

  const now = new Date();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search & Filters */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex items-center flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks by key, title, or #tag..."
              className="w-full bg-slate-950 text-slate-100 text-sm pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Lane Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedLaneFilter}
              onChange={(e) => setSelectedLaneFilter(e.target.value)}
              className="bg-slate-950 text-slate-300 text-sm px-3 py-1.5 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Lanes ({lanes.length})</option>
              {lanes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="bg-slate-950 text-slate-300 text-sm px-3 py-1.5 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="none">None</option>
            </select>
          </div>

          {/* Archived Filter Toggle */}
          {archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((prev) => !prev)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                showArchived
                  ? 'bg-amber-950/70 text-amber-300 border-amber-700/80 font-medium'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
              title={showArchived ? 'Switch back to active tasks' : 'View archived tasks'}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{showArchived ? 'Archived Only' : 'Archived'} ({archivedCount})</span>
            </button>
          )}
        </div>

        {/* Right: Quick Add Form */}
        <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Quick task title..."
            className="bg-slate-950 text-slate-100 text-sm px-3 py-1.5 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 w-60"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          {/* Table Header */}
          <thead className="bg-slate-900/90 sticky top-0 z-10 border-b border-slate-800 shadow-sm backdrop-blur-sm">
            <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th
                onClick={() => handleSort('key')}
                className="py-3 px-4 w-28 cursor-pointer hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Key</span>
                  {renderSortIcon('key')}
                </div>
              </th>
              <th
                onClick={() => handleSort('title')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Title</span>
                  {renderSortIcon('title')}
                </div>
              </th>
              <th
                onClick={() => handleSort('lane')}
                className="py-3 px-4 w-44 cursor-pointer hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status / Lane</span>
                  {renderSortIcon('lane')}
                </div>
              </th>
              <th
                onClick={() => handleSort('priority')}
                className="py-3 px-4 w-32 cursor-pointer hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  {renderSortIcon('priority')}
                </div>
              </th>
              <th
                onClick={() => handleSort('dueDate')}
                className="py-3 px-4 w-36 cursor-pointer hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Due Date</span>
                  {renderSortIcon('dueDate')}
                </div>
              </th>
              <th
                onClick={() => handleSort('estimate')}
                className="py-3 px-4 w-28 cursor-pointer hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Estimate</span>
                  {renderSortIcon('estimate')}
                </div>
              </th>
              <th className="py-3 px-4 w-48">Tags</th>
              <th className="py-3 px-4 w-24 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-500">
                  <p className="text-base font-medium text-slate-400">
                    {showArchived ? 'No archived tasks found' : 'No tasks found'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {showArchived
                      ? 'Archived tasks from the Done lane will appear here.'
                      : 'Try changing your search query or filters.'}
                  </p>
                  {showArchived && (
                    <button
                      type="button"
                      onClick={() => setShowArchived(false)}
                      className="mt-3 text-xs text-indigo-400 hover:underline"
                    >
                      Back to active tasks
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              sortedTasks.map((task) => {
                const lane = laneMap.get(task.laneId) || {
                  id: task.laneId,
                  name: task.laneId,
                  color: '#64748b',
                  type: 'unstarted'
                };
                const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
                const totalSubtasks = task.subtasks?.length || 0;

                const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
                const isOverdue =
                  dueDateObj && lane.type !== 'completed' ? dueDateObj.getTime() < now.getTime() : false;
                const isCompleted = lane.type === 'completed';

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                    onClick={() => onSelectTask(task)}
                  >
                    {/* Key */}
                    <td className="py-2.5 px-4 font-mono font-bold text-xs">
                      <span className="text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60 group-hover:border-indigo-600 transition-colors">
                        {task.key}
                      </span>
                    </td>

                    {/* Title & Subtasks pill */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2 max-w-xl">
                        {task.archived && (
                          <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 shrink-0">
                            Archived
                          </span>
                        )}
                        <span
                          className={`font-medium truncate ${
                            isCompleted || task.archived ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          {task.title}
                        </span>
                        {totalSubtasks > 0 && (
                          <span
                            className={`text-[11px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                              completedSubtasks === totalSubtasks
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            {`${completedSubtasks}/${totalSubtasks}`}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status / Lane (Dropdown inside cell) */}
                    <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <LaneMarker icon={lane.icon} color={lane.color} size={14} className="shrink-0" />
                        <select
                          value={task.laneId}
                          onChange={(e) => onUpdateTask(task.id, { laneId: e.target.value })}
                          className="bg-slate-900/80 hover:bg-slate-900 text-slate-200 text-xs px-2 py-1 rounded border border-slate-800 outline-none focus:border-indigo-500 cursor-pointer max-w-[140px] truncate"
                        >
                          {lanes.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={task.priority}
                        onChange={(e) =>
                          onUpdateTask(task.id, { priority: e.target.value as TaskPriority })
                        }
                        className={`text-xs px-2 py-1 rounded border outline-none font-medium cursor-pointer ${
                          PRIORITY_COLORS[task.priority].bg
                        } ${PRIORITY_COLORS[task.priority].text} ${
                          PRIORITY_COLORS[task.priority].border
                        }`}
                      >
                        <option value="urgent" className="bg-slate-900 text-rose-400">
                          Urgent
                        </option>
                        <option value="high" className="bg-slate-900 text-amber-400">
                          High
                        </option>
                        <option value="medium" className="bg-slate-900 text-blue-400">
                          Medium
                        </option>
                        <option value="low" className="bg-slate-900 text-slate-400">
                          Low
                        </option>
                        <option value="none" className="bg-slate-900 text-slate-500">
                          None
                        </option>
                      </select>
                    </td>

                    {/* Due Date */}
                    <td className="py-2.5 px-4 font-mono text-xs">
                      {dueDateObj ? (
                        <span
                          className={`flex items-center gap-1 ${
                            isOverdue
                              ? 'text-rose-400 font-semibold'
                              : isCompleted
                              ? 'text-slate-500'
                              : 'text-slate-300'
                          }`}
                        >
                          {isOverdue && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                          <span>
                            {dueDateObj.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Estimate */}
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-400">
                      {task.estimateMinutes ? (
                        <span>
                          {task.estimateMinutes >= 60
                            ? `${Math.floor(task.estimateMinutes / 60)}h ${
                                task.estimateMinutes % 60 > 0 ? `${task.estimateMinutes % 60}m` : ''
                              }`
                            : `${task.estimateMinutes}m`}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Tags */}
                    <td className="py-2.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {task.tags && task.tags.length > 0 ? (
                          task.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[11px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900/50"
                            >
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {task.archived ? (
                          onUnarchiveTask && (
                            <button
                              type="button"
                              onClick={() => onUnarchiveTask(task.id)}
                              title="Restore task to board"
                              className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded border border-slate-700 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3 text-indigo-400" />
                              <span>Restore</span>
                            </button>
                          )
                        ) : (
                          isTimeTrackingEnabled && (
                            <button
                              type="button"
                              onClick={() => onToggleTimer(task.id)}
                              title={task.isTimerRunning ? 'Stop Timer' : 'Start Timer'}
                              className={`p-1.5 rounded-md transition-colors ${
                                task.isTimerRunning
                                  ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              {task.isTimerRunning ? (
                                <Square className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              )}
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Status Bar */}
      <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div>
          Showing {sortedTasks.length} {showArchived ? 'archived ' : ''}of {tasks.length} tasks
        </div>
        <div className="flex items-center gap-4">
          {isTimeTrackingEnabled && (
            <span>{tasks.filter((t) => t.isTimerRunning).length} active timer</span>
          )}
          <span>{tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.laneId !== 'done' && !t.archived).length} overdue</span>
        </div>
      </div>
    </div>
  );
};
