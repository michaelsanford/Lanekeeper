import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Clock,
  Play,
  Square,
  CheckSquare,
  ArrowUpRight
} from 'lucide-react';
import type { Task, Lane, TaskPriority } from '../../types/index.js';

interface TaskDetailDrawerProps {
  task: Task | null;
  lanes: Lane[];
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTimer: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onPromoteSubtask: (parentTaskId: string, subtaskId: string) => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  lanes,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onToggleTimer,
  onToggleSubtask,
  onAddSubtask,
  onPromoteSubtask
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [description, setDescription] = useState('');

  // Live timer tick
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!task?.isTimerRunning) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [task?.isTimerRunning]);

  useEffect(() => {
    if (task) {
      setDescription(task.description || '');
    }
  }, [task]);

  if (!task) return null;

  const totalElapsedSeconds =
    (task.timeSpentSeconds || 0) +
    (task.isTimerRunning && task.timerStartedAt
      ? Math.floor((Date.now() - task.timerStartedAt) / 1000)
      : 0);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m ${secs % 60}s`;
    if (mins > 0) return `${mins}m ${secs % 60}s`;
    return `${secs}s`;
  };

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      onAddSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== task.description) {
      onUpdateTask(task.id, { description });
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-800/60">
              {task.key}
            </span>

            {/* Lane Status Dropdown */}
            <select
              value={task.laneId}
              onChange={(e) => onUpdateTask(task.id, { laneId: e.target.value })}
              className="bg-slate-950 text-xs font-semibold text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500"
            >
              {lanes.map((lane) => (
                <option key={lane.id} value={lane.id}>
                  {lane.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm(`Delete task ${task.key}?`)) {
                  onDeleteTask(task.id);
                  onClose();
                }
              }}
              title="Delete task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              title="Close drawer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Title input */}
          <input
            type="text"
            value={task.title}
            onChange={(e) => onUpdateTask(task.id, { title: e.target.value })}
            className="w-full text-xl font-bold bg-transparent text-slate-100 border-b border-transparent hover:border-slate-700 focus:border-indigo-500 outline-none py-1 transition-all"
          />

          {/* Properties Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
            {/* Priority */}
            <div className="space-y-1">
              <span className="text-slate-500 font-mono text-[10px] uppercase">Priority</span>
              <select
                value={task.priority}
                onChange={(e) =>
                  onUpdateTask(task.id, { priority: e.target.value as TaskPriority })
                }
                className="w-full bg-slate-900 text-slate-200 p-1.5 rounded-md border border-slate-800 outline-none"
              >
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <span className="text-slate-500 font-mono text-[10px] uppercase">Due Date</span>
              <input
                type="date"
                value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                onChange={(e) =>
                  onUpdateTask(task.id, {
                    dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                  })
                }
                className="w-full bg-slate-900 text-slate-200 p-1.5 rounded-md border border-slate-800 outline-none"
              />
            </div>

            {/* Estimate */}
            <div className="space-y-1">
              <span className="text-slate-500 font-mono text-[10px] uppercase">Estimate (min)</span>
              <input
                type="number"
                placeholder="Minutes..."
                value={task.estimateMinutes || ''}
                onChange={(e) =>
                  onUpdateTask(task.id, {
                    estimateMinutes: e.target.value ? parseInt(e.target.value, 10) : undefined
                  })
                }
                className="w-full bg-slate-900 text-slate-200 p-1.5 rounded-md border border-slate-800 outline-none"
              />
            </div>
          </div>

          {/* Time Tracking Widget */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  task.isTimerRunning
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400">Time Tracked</span>
                <div className="font-mono text-base font-bold text-slate-100">
                  {formatTime(totalElapsedSeconds)}
                </div>
              </div>
            </div>

            <button
              onClick={() => onToggleTimer(task.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                task.isTimerRunning
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {task.isTimerRunning ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Timer</span>
                </>
              )}
            </button>
          </div>

          {/* Markdown Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Description & Specifications (Markdown)
            </label>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Add detailed markdown specifications, reproduction steps, or architecture notes..."
              className="w-full bg-slate-950 text-slate-200 text-xs p-3 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 font-mono leading-relaxed placeholder-slate-600"
            />
          </div>

          {/* Subtask / Checklist with "Promote to Task" */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Checklist & Subtasks ({task.subtasks.length})</span>
              </label>
            </div>

            <div className="space-y-1.5">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  className="group flex items-center justify-between p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => onToggleSubtask(task.id, st.id)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span
                      className={`text-xs ${
                        st.completed ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {st.title}
                    </span>
                  </label>

                  {/* Promote to Task Action */}
                  <button
                    onClick={() => onPromoteSubtask(task.id, st.id)}
                    title="Promote to standalone task ticket"
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded hover:bg-indigo-950/60 transition-all"
                  >
                    <span>Promote</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask Input */}
            <form onSubmit={handleAddSubtaskSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Add checklist item..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 bg-slate-950 text-xs px-3 py-1.5 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 placeholder-slate-600"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
