import type { Task, Lane, Subtask } from '../../../frontend/src/types/index.js';
import { getRankBetween, sortTasksByRank } from '../../../frontend/src/utils/rank.js';

/**
 * Pure state transitions for the demo workspace, mirroring CrdtStore's own
 * methods (frontend/src/crdt/doc.ts) but operating on a plain Task[] instead
 * of a Y.Doc. Kept free of React so they can be unit tested directly.
 */

export function moveTask(tasks: Task[], taskId: string, laneId: string, rank: string): Task[] {
  return tasks.map((t) => (t.id === taskId ? { ...t, laneId, rank, updatedAt: new Date().toISOString() } : t));
}

export function addTask(tasks: Task[], laneId: string, title: string): Task[] {
  const laneTasks = sortTasksByRank(tasks.filter((t) => t.laneId === laneId));
  const rank = getRankBetween(laneTasks[laneTasks.length - 1]?.rank, undefined);
  const now = new Date().toISOString();
  const key = `LK-${tasks.length + 1}`;
  const task: Task = {
    id: key,
    key,
    title,
    description: '',
    priority: 'none',
    laneId,
    rank,
    tags: [],
    subtasks: [],
    createdAt: now,
    updatedAt: now
  };
  return [...tasks, task];
}

export function toggleTimer(tasks: Task[], taskId: string): Task[] {
  return tasks.map((t) => {
    if (t.id !== taskId) return t;
    const running = !t.isTimerRunning;
    return { ...t, isTimerRunning: running, timerStartedAt: running ? Date.now() : undefined };
  });
}

export function archiveCompletedTasks(tasks: Task[], lanes: Lane[], olderThanDays: number): { tasks: Task[]; count: number } {
  const cutoff = Date.now() - olderThanDays * 86_400_000;
  let count = 0;
  const nextTasks = tasks.map((t) => {
    const lane = lanes.find((l) => l.id === t.laneId);
    if (lane?.type === 'completed' && !t.archived && new Date(t.updatedAt).getTime() < cutoff) {
      count++;
      return { ...t, archived: true, archivedAt: new Date().toISOString() };
    }
    return t;
  });
  return { tasks: nextTasks, count };
}

export function updateTask(tasks: Task[], taskId: string, updates: Partial<Task>): Task[] {
  return tasks.map((t) =>
    t.id === taskId ? { ...t, ...updates, updatedAt: updates.updatedAt || new Date().toISOString() } : t
  );
}

export function deleteTask(tasks: Task[], taskId: string): Task[] {
  return tasks.filter((t) => t.id !== taskId);
}

export function duplicateTask(tasks: Task[], taskId: string): { tasks: Task[]; created: Task | null } {
  const existing = tasks.find((t) => t.id === taskId);
  if (!existing) return { tasks, created: null };

  const now = new Date().toISOString();
  const laneTasks = sortTasksByRank(tasks.filter((t) => t.laneId === existing.laneId));
  const rank = getRankBetween(laneTasks[laneTasks.length - 1]?.rank, undefined);

  const duplicated: Task = {
    ...existing,
    id: crypto.randomUUID(),
    key: `LK-${tasks.length + 1}`,
    title: `${existing.title} (Copy)`,
    timeSpentSeconds: 0,
    isTimerRunning: false,
    timerStartedAt: undefined,
    rank,
    subtasks: existing.subtasks.map((st) => ({ id: crypto.randomUUID(), title: st.title, completed: false })),
    createdAt: now,
    updatedAt: now
  };

  return { tasks: [...tasks, duplicated], created: duplicated };
}

export function toggleSubtask(tasks: Task[], taskId: string, subtaskId: string): Task[] {
  return tasks.map((t) =>
    t.id === taskId
      ? {
          ...t,
          subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st)),
          updatedAt: new Date().toISOString()
        }
      : t
  );
}

export function addSubtask(tasks: Task[], taskId: string, title: string): Task[] {
  const trimmed = title.trim();
  if (!trimmed) return tasks;
  const newSubtask: Subtask = { id: crypto.randomUUID(), title: trimmed, completed: false };
  return tasks.map((t) =>
    t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSubtask], updatedAt: new Date().toISOString() } : t
  );
}

export function promoteSubtaskToTask(
  tasks: Task[],
  parentTaskId: string,
  subtaskId: string
): { tasks: Task[]; created: Task | null } {
  const parent = tasks.find((t) => t.id === parentTaskId);
  if (!parent) return { tasks, created: null };
  const subtask = parent.subtasks.find((st) => st.id === subtaskId);
  if (!subtask) return { tasks, created: null };

  const now = new Date().toISOString();
  const laneTasks = sortTasksByRank(tasks.filter((t) => t.laneId === parent.laneId));
  const rank = getRankBetween(laneTasks[laneTasks.length - 1]?.rank, undefined);
  const child: Task = {
    id: crypto.randomUUID(),
    key: `LK-${tasks.length + 1}`,
    title: subtask.title,
    description: `> Child task promoted from parent **${parent.key}** (${parent.title})\n\n`,
    priority: parent.priority,
    laneId: parent.laneId,
    rank,
    tags: [...parent.tags],
    subtasks: [],
    createdAt: now,
    updatedAt: now
  };

  const nextTasks = [
    ...tasks.map((t) =>
      t.id === parentTaskId ? { ...t, subtasks: t.subtasks.filter((st) => st.id !== subtaskId), updatedAt: now } : t
    ),
    child
  ];

  return { tasks: nextTasks, created: child };
}

export function archiveTask(tasks: Task[], taskId: string): Task[] {
  return tasks.map((t) => {
    if (t.id !== taskId) return t;
    const updates: Partial<Task> = { archived: true, archivedAt: new Date().toISOString() };
    if (t.isTimerRunning && t.timerStartedAt) {
      const elapsedSeconds = Math.floor((Date.now() - t.timerStartedAt) / 1000);
      updates.timeSpentSeconds = (t.timeSpentSeconds || 0) + elapsedSeconds;
      updates.isTimerRunning = false;
      updates.timerStartedAt = undefined;
    }
    return { ...t, ...updates };
  });
}

export function unarchiveTask(tasks: Task[], taskId: string): Task[] {
  return tasks.map((t) => (t.id === taskId ? { ...t, archived: false, archivedAt: undefined } : t));
}
