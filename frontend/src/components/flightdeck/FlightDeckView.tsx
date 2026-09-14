import React, { useState, useEffect } from 'react';
import {
  Target,
  Clock,
  AlertCircle,
  CheckCircle2,
  Play,
  Square,
  ArrowRight,
  FileText,
  Plus
} from 'lucide-react';
import type { Task } from '../../types/index.js';

interface FlightDeckViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onToggleTimer: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onOpenQuickCapture: () => void;
  onCreateTaskFromScratchpad: (text: string) => void;
}

const SCRATCHPAD_KEY = 'lanekeeper_scratchpad_notes';

export const FlightDeckView: React.FC<FlightDeckViewProps> = ({
  tasks,
  onSelectTask,
  onToggleTimer,
  onCompleteTask,
  onOpenQuickCapture,
  onCreateTaskFromScratchpad
}) => {
  const [scratchpadText, setScratchpadText] = useState(() => {
    return localStorage.getItem(SCRATCHPAD_KEY) || '';
  });

  useEffect(() => {
    localStorage.setItem(SCRATCHPAD_KEY, scratchpadText);
  }, [scratchpadText]);

  // Tasks in progress (Flight deck strict limit: 1-3)
  const inFlightTasks = tasks.filter((t) => t.laneId === 'inprogress');

  // Tasks due today or overdue
  const now = new Date();
  const todayDateStr = now.toDateString();
  const dueTodayOrOverdueTasks = tasks.filter((t) => {
    if (!t.dueDate || t.laneId === 'done') return false;
    const d = new Date(t.dueDate);
    return d.toDateString() === todayDateStr || d.getTime() < now.getTime();
  });

  const handleConvertScratchpad = () => {
    if (scratchpadText.trim()) {
      onCreateTaskFromScratchpad(scratchpadText.trim());
      setScratchpadText('');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950/40 p-5 rounded-2xl border border-indigo-900/40 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center border border-indigo-500/40">
            <Target className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">Today's Flight Deck</h1>
            <p className="text-xs text-slate-400">
              Focus mode: single-tasking flow, strict WIP control, and immediate capture.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenQuickCapture}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Capture</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1 & 2: In-Flight & Due Alerts */}
        <div className="md:col-span-2 space-y-6">
          {/* Active Flight Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>In Flight ({inFlightTasks.length}/3 WIP)</span>
              </h2>
              {inFlightTasks.length > 3 && (
                <span className="text-[11px] text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/60 font-mono">
                  Gentle Warning: Exceeding recommended WIP
                </span>
              )}
            </div>

            {inFlightTasks.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center space-y-3 bg-slate-900/40">
                <p className="text-sm text-slate-400">No tasks currently in flight.</p>
                <p className="text-xs text-slate-500">
                  Pick a card from your To Do lane or capture a task to focus on right now.
                </p>
                <button
                  onClick={onOpenQuickCapture}
                  className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start a task</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {inFlightTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                            {task.key}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {task.priority !== 'none' && `!${task.priority}`}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-100">{task.title}</h3>
                      </div>

                      {/* Timer button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTimer(task.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                          task.isTimerRunning
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {task.isTimerRunning ? (
                          <Square className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>{task.isTimerRunning ? 'Pause' : 'Focus'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                      <span>{task.subtasks.length} subtasks</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompleteTask(task.id);
                        }}
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Done</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Due Today & Overdue Section */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Due Today & Overdue ({dueTodayOrOverdueTasks.length})</span>
            </h2>

            {dueTodayOrOverdueTasks.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-900/30 rounded-xl border border-slate-800/50">
                All clear! No overdue tasks pending.
              </p>
            ) : (
              <div className="space-y-2">
                {dueTodayOrOverdueTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl hover:border-amber-500/40 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-amber-400">{task.key}</span>
                      <span className="text-xs text-slate-200 font-medium">{task.title}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Scratchpad Buffer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quick Scratchpad</span>
            </h2>
            {scratchpadText.trim() && (
              <button
                onClick={handleConvertScratchpad}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
              >
                Promote to Task &rarr;
              </button>
            )}
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col h-[22rem]">
            <textarea
              placeholder="Jot down quick thoughts, terminal commands, or rough notes here..."
              value={scratchpadText}
              onChange={(e) => setScratchpadText(e.target.value)}
              className="w-full flex-1 bg-transparent text-xs text-slate-200 outline-none resize-none placeholder-slate-500 font-mono leading-relaxed"
            />
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
              <span>Saved locally</span>
              <span>Markdown supported</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
