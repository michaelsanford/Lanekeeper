import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  CheckSquare,
  Play,
  Square,
  Tag,
  AlertCircle
} from 'lucide-react';
import type { Task, TaskPriority } from '../../types/index.js';
import { useFeatureGate } from '../../features/index.js';

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  onToggleTimer: (taskId: string) => void;
  enableTimeTracking?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onSelect,
  onToggleTimer,
  enableTimeTracking
}) => {
  const { isEnabled } = useFeatureGate();
  const isTimeTrackingEnabled = enableTimeTracking ?? isEnabled('timeTracking');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  // Live timer tick if active
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isTimeTrackingEnabled || !task.isTimerRunning) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isTimeTrackingEnabled, task.isTimerRunning]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
    urgent: { label: 'Urgent', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    high: { label: 'High', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    medium: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
    low: { label: 'Low', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    none: { label: '', color: '' }
  };

  // Format elapsed time
  const totalElapsedSeconds =
    (task.timeSpentSeconds || 0) +
    (task.isTimerRunning && task.timerStartedAt
      ? Math.floor((Date.now() - task.timerStartedAt) / 1000)
      : 0);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m`;
    return `${secs}s`;
  };

  // Due date status
  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDateObj ? dueDateObj.getTime() < Date.now() : false;
  const isDueToday = dueDateObj
    ? dueDateObj.toDateString() === new Date().toDateString()
    : false;

  const completedSubtasks = task.subtasks.filter((st) => st.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(task)}
      className={`group relative bg-slate-900/90 hover:bg-slate-800/90 rounded-xl p-3 border border-slate-800 hover:border-indigo-500/40 shadow-sm transition-all cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'opacity-40 shadow-2xl ring-2 ring-indigo-500' : ''
      }`}
    >
      {/* Top Bar: Key & Priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
          {task.key}
        </span>

        <div className="flex items-center gap-1.5">
          {task.priority !== 'none' && (
            <span
              className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                priorityConfig[task.priority].color
              }`}
            >
              {priorityConfig[task.priority].label}
            </span>
          )}

          {/* Inline Timer Button */}
          {isTimeTrackingEnabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleTimer(task.id);
              }}
              title={task.isTimerRunning ? 'Stop timer' : 'Start timer'}
              className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded transition-colors ${
                task.isTimerRunning
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {task.isTimerRunning ? (
                <Square className="w-3 h-3 fill-current" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              {totalElapsedSeconds > 0 && <span>{formatTime(totalElapsedSeconds)}</span>}
            </button>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h3 className="text-base font-semibold text-slate-100 line-clamp-2 mb-2 leading-snug group-hover:text-indigo-200 transition-colors">
        {task.title}
      </h3>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800"
            >
              <Tag className="w-3 h-3 text-slate-400" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Metadata: Subtasks & Due Date */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-slate-800/80 mt-1">
        {totalSubtasks > 0 ? (
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
            <span
              className={
                completedSubtasks === totalSubtasks
                  ? 'text-emerald-400 font-medium'
                  : 'text-slate-400'
              }
            >
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
        ) : (
          <div />
        )}

        {dueDateObj && (
          <div
            className={`flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 rounded ${
              isOverdue
                ? 'text-rose-400 bg-rose-950/40 border border-rose-800/50'
                : isDueToday
                ? 'text-amber-400 bg-amber-950/40 border border-amber-800/50'
                : 'text-slate-400'
            }`}
          >
            {isOverdue && <AlertCircle className="w-3 h-3" />}
            <Calendar className="w-3 h-3" />
            <span>{dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>
    </div>
  );
};
