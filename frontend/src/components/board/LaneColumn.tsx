import React, { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Archive } from 'lucide-react';
import { LaneMarker } from '../icons/LaneMarker.js';
import type { Lane, Task } from '../../types/index.js';
import { TaskCard } from './TaskCard.js';
import { useFeatureGate, getArchiveThresholdDays } from '../../features/index.js';

interface LaneColumnProps {
  lane: Lane;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onToggleTimer: (taskId: string) => void;
  onAddTask: (laneId: string, title: string) => void;
  onArchiveCompletedTasks?: (olderThanDays: number) => number;
}

export const LaneColumn: React.FC<LaneColumnProps> = ({
  lane,
  tasks,
  onSelectTask,
  onToggleTimer,
  onAddTask,
  onArchiveCompletedTasks
}) => {
  const { isEnabled } = useFeatureGate();
  const isArchivingEnabled = isEnabled('doneLaneArchiving');
  const isCompletedLane = lane.type === 'completed';
  const thresholdDays = getArchiveThresholdDays();

  // Find tasks eligible for archive
  const eligibleArchiveCount = useMemo(() => {
    if (!isCompletedLane || !isArchivingEnabled) return 0;
    const cutoff = Date.now() - thresholdDays * 86400000;
    return tasks.filter((t) => !t.archived && new Date(t.updatedAt).getTime() <= cutoff).length;
  }, [tasks, isCompletedLane, isArchivingEnabled, thresholdDays]);

  const [archiveSuccess, setArchiveSuccess] = useState<number | null>(null);

  const handleArchive = () => {
    if (onArchiveCompletedTasks && eligibleArchiveCount > 0) {
      const count = onArchiveCompletedTasks(thresholdDays);
      setArchiveSuccess(count);
      setTimeout(() => setArchiveSuccess(null), 3000);
    }
  };

  const { setNodeRef, isOver } = useDroppable({
    id: lane.id
  });

  const [isAdding, setIsAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  const isWipExceeded = lane.wipLimit ? tasks.length > lane.wipLimit : false;
  const isAtWipLimit = lane.wipLimit ? tasks.length === lane.wipLimit : false;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTitle.trim()) {
      onAddTask(lane.id, quickTitle.trim());
      setQuickTitle('');
      setIsAdding(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 min-w-[20rem] max-w-[20rem] bg-slate-950/60 rounded-2xl border transition-colors flex-shrink-0 max-h-full ${
        isOver ? 'border-indigo-500/60 bg-indigo-950/20' : 'border-slate-800/80'
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <span
            className="flex items-center justify-center transition-transform hover:scale-110"
            style={{ color: lane.color }}
            title={`Swimlane: ${lane.name}`}
          >
            <LaneMarker icon={lane.icon} color={lane.color} size={18} />
          </span>
          <h2 className="font-bold text-base text-slate-200 tracking-tight">
            {lane.name}
          </h2>
          <span className="text-sm font-mono font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {tasks.length}
          </span>
        </div>

        {/* Traffic Flow & WIP Control */}
        <div className="flex items-center gap-1.5">
          {/* Archive Done Action (Feature 5 - Gated) */}
          {isCompletedLane && isArchivingEnabled && eligibleArchiveCount > 0 && (
            <button
              type="button"
              onClick={handleArchive}
              title={`Archive ${eligibleArchiveCount} tasks completed >${thresholdDays}d ago`}
              className="flex items-center gap-1 text-[11px] font-mono text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-800/60 transition-colors"
            >
              <Archive className="w-3 h-3" />
              <span>Archive ({eligibleArchiveCount})</span>
            </button>
          )}
          {archiveSuccess !== null && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              Archived {archiveSuccess}
            </span>
          )}

          {lane.wipLimit && lane.wipLimit > 0 ? (
            <div
              title={`Lane Flow Capacity: ${tasks.length}/${lane.wipLimit} (${
                isWipExceeded ? 'Exceeded - Stop' : isAtWipLimit ? 'At Limit - Caution' : 'Flowing - Open'
              })`}
              className={`flex items-center gap-1.5 text-xs font-mono font-medium px-2 py-0.5 rounded-full border transition-all ${
                isWipExceeded
                  ? 'bg-rose-950/60 text-rose-300 border-rose-700/80 animate-pulse'
                  : isAtWipLimit
                  ? 'bg-amber-950/50 text-amber-300 border-amber-700/60'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isWipExceeded
                    ? 'bg-rose-400'
                    : isAtWipLimit
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span>
                {tasks.length}/{lane.wipLimit}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[10rem]">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onSelect={onSelectTask}
              onToggleTimer={onToggleTimer}
            />
          ))}
        </SortableContext>

        {/* Empty Lane Placeholder */}
        {tasks.length === 0 && !isAdding && (
          <div className="h-24 flex items-center justify-center text-sm text-slate-600 border border-dashed border-slate-800/60 rounded-xl select-none">
            Drop task here
          </div>
        )}
      </div>

      {/* Bottom Quick Add Action */}
      <div className="p-2.5 border-t border-slate-800/60">
        {isAdding ? (
          <form onSubmit={handleQuickAdd} className="space-y-2">
            <input
              type="text"
              autoFocus
              placeholder="Task title..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsAdding(false);
              }}
              className="w-full bg-slate-900 text-slate-100 text-sm px-3 py-2 rounded-lg border border-indigo-500/60 outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-sm text-slate-400 hover:text-slate-200 px-2.5 py-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1 rounded-md"
              >
                Add
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 py-2 rounded-lg transition-colors border border-transparent hover:border-slate-800/60"
          >
            <Plus className="w-4 h-4" />
            <span>Add task</span>
          </button>
        )}
      </div>
    </div>
  );
};
