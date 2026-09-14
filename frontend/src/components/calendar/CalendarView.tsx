import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  AlertCircle,
  ListFilter
} from 'lucide-react';
import type { Task, Lane, TaskPriority } from '../../types/index.js';
import { SwimlaneBuoyIcon } from '../icons/LaneIcons.js';

interface CalendarViewProps {
  tasks: Task[];
  lanes: Lane[];
  onSelectTask: (task: Task) => void;
  onToggleTimer?: (taskId: string) => void;
  onAddTask: (task: { title: string; laneId: string; dueDate?: string; priority?: TaskPriority }) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

interface CalendarDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  lanes,
  onSelectTask,
  onAddTask
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [quickAddDayStr, setQuickAddDayStr] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [showUnscheduledSidebar, setShowUnscheduledSidebar] = useState(true);

  const laneMap = useMemo(() => {
    const map = new Map<string, Lane>();
    for (const lane of lanes) {
      map.set(lane.id, lane);
    }
    return map;
  }, [lanes]);

  const defaultLaneId = lanes[0]?.id || 'triage';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Format date helper: YYYY-MM-DD local
  const formatDateKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Build calendar matrix (42 days, 6 rows x 7 cols)
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const today = new Date();
    const todayKey = formatDateKey(today);

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun

    const days: CalendarDay[] = [];

    // Previous month leading days
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDate - i);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateStr: key,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: key === todayKey,
        isPast: d < today && key !== todayKey
      });
    }

    // Current month days
    const currentMonthTotalDays = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= currentMonthTotalDays; i++) {
      const d = new Date(year, month, i);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateStr: key,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: key === todayKey,
        isPast: d < today && key !== todayKey
      });
    }

    // Next month trailing days to complete 42 cells (6 rows)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateStr: key,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isPast: false
      });
    }

    return days;
  }, [year, month]);

  // Index tasks by dateStr (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (task.dueDate) {
        try {
          const d = new Date(task.dueDate);
          const key = formatDateKey(d);
          const existing = map.get(key) || [];
          existing.push(task);
          map.set(key, existing);
        } catch {}
      }
    }
    return map;
  }, [tasks]);

  // Unscheduled tasks and overdue tasks
  const now = new Date();
  const todayKey = formatDateKey(now);

  const unscheduledTasks = useMemo(() => {
    return tasks.filter((t) => !t.dueDate && t.laneId !== 'done');
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.dueDate || t.laneId === 'done') return false;
      const d = new Date(t.dueDate);
      return formatDateKey(d) < todayKey;
    });
  }, [tasks, todayKey]);

  const handleQuickAddSubmit = (dateStr: string) => {
    if (quickAddTitle.trim()) {
      onAddTask({
        title: quickAddTitle.trim(),
        laneId: defaultLaneId,
        dueDate: new Date(`${dateStr}T12:00:00`).toISOString()
      });
      setQuickAddTitle('');
      setQuickAddDayStr(null);
    }
  };

  return (
    <div className="flex-1 flex h-full bg-slate-950 overflow-hidden select-none">
      {/* Main Calendar View */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Calendar Header Navigation */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
              <span>
                {MONTH_NAMES[month]} {year}
              </span>
            </h1>

            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5 ml-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowUnscheduledSidebar((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                showUnscheduledSidebar
                  ? 'bg-indigo-950/60 border-indigo-700/60 text-indigo-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Unscheduled ({unscheduledTasks.length})</span>
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/40 text-center text-xs font-semibold text-slate-400 py-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="tracking-wider uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Month Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-800/60 bg-slate-950 overflow-y-auto">
          {calendarDays.map((day) => {
            const dayTasks = tasksByDate.get(day.dateStr) || [];
            const isQuickAddOpen = quickAddDayStr === day.dateStr;

            return (
              <div
                key={day.dateStr}
                className={`flex flex-col p-1.5 min-h-[90px] transition-colors relative group ${
                  day.isCurrentMonth ? 'bg-slate-950/80' : 'bg-slate-950/30 opacity-40'
                } ${day.isToday ? 'ring-1 ring-inset ring-indigo-500/50 bg-indigo-950/10' : ''}`}
              >
                {/* Date Header Row */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                      day.isToday
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : day.isCurrentMonth
                        ? 'text-slate-300'
                        : 'text-slate-600'
                    }`}
                  >
                    {day.dayNumber}
                  </span>

                  {/* Add Task Button for Date */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAddDayStr(day.dateStr);
                      setQuickAddTitle('');
                    }}
                    title={`Schedule task for ${day.dateStr}`}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Inline Quick Add Form */}
                {isQuickAddOpen && (
                  <div className="mb-1 p-1 bg-slate-900 rounded border border-indigo-500/60 z-10 shadow-lg">
                    <input
                      type="text"
                      autoFocus
                      value={quickAddTitle}
                      onChange={(e) => setQuickAddTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAddSubmit(day.dateStr);
                        if (e.key === 'Escape') setQuickAddDayStr(null);
                      }}
                      placeholder="Task title..."
                      className="w-full bg-slate-950 text-xs px-1.5 py-1 rounded text-slate-100 outline-none border border-slate-700"
                    />
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => setQuickAddDayStr(null)}
                        className="text-[10px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAddSubmit(day.dateStr)}
                        className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded font-medium"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Day Tasks List */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[110px] pr-0.5">
                  {dayTasks.map((task) => {
                    const lane = laneMap.get(task.laneId);
                    const isCompleted = lane?.type === 'completed';

                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(task);
                        }}
                        title={`${task.key}: ${task.title}`}
                        className={`p-1 rounded text-xs border transition-all cursor-pointer truncate flex items-center gap-1.5 ${
                          isCompleted
                            ? 'bg-slate-900/40 border-slate-800/40 opacity-60 text-slate-400'
                            : 'bg-slate-900 border-slate-800 hover:border-indigo-500 text-slate-200 hover:shadow-sm'
                        }`}
                      >
                        {/* Lane Color Dot */}
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: lane?.color || '#64748b' }}
                        />

                        {/* Monospace Key */}
                        <span className="font-mono text-[10px] text-indigo-400 shrink-0 font-semibold">
                          {task.key}
                        </span>

                        {/* Title */}
                        <span className={`truncate ${isCompleted ? 'line-through' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled & Overdue Sidebar */}
      {showUnscheduledSidebar && (
        <aside className="w-80 border-l border-slate-800 bg-slate-900/50 flex flex-col h-full select-none shrink-0">
          {/* Overdue Section */}
          {overdueTasks.length > 0 && (
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center gap-2 mb-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Overdue Tasks ({overdueTasks.length})</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="p-2 rounded-lg bg-rose-950/20 border border-rose-900/40 hover:border-rose-700 cursor-pointer text-xs transition-colors space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-rose-400 font-bold">{task.key}</span>
                      <span className="text-[10px] text-rose-400 font-mono">
                        {task.dueDate && new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-slate-200 font-medium truncate">{task.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unscheduled Backlog Section */}
          <div className="flex-1 p-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Unscheduled ({unscheduledTasks.length})
              </span>
            </div>
            <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
              {unscheduledTasks.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  All active tasks are scheduled with due dates.
                </div>
              ) : (
                unscheduledTasks.map((task) => {
                  const lane = laneMap.get(task.laneId);
                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/60 cursor-pointer text-xs transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-indigo-400 font-bold">{task.key}</span>
                        <div className="flex items-center gap-1">
                          <span style={{ color: lane?.color }}>
                            <SwimlaneBuoyIcon size={12} />
                          </span>
                          <span className="text-[10px] text-slate-400">{lane?.name}</span>
                        </div>
                      </div>
                      <p className="text-slate-200 font-medium truncate">{task.title}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
