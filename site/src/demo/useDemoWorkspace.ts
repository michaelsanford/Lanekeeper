import { useCallback, useState } from 'react';
import type { Task, Lane } from '../../../frontend/src/types/index.js';
import { runLkCommand } from './lkCommand.js';
import { DEMO_LANES, buildInitialTasks } from './demoData.js';
import * as actions from './workspaceActions.js';

export interface DemoWorkspace {
  lanes: Lane[];
  tasks: Task[];
  selectedTask: Task | null;
  selectTask: (task: Task | null) => void;
  toggleTimer: (taskId: string) => void;
  moveTask: (taskId: string, laneId: string, rank: string) => void;
  addTask: (laneId: string, title: string) => void;
  archiveCompletedTasks: (olderThanDays: number) => number;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  duplicateTask: (taskId: string) => Task | null;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  promoteSubtaskToTask: (parentTaskId: string, subtaskId: string) => Task | null;
  archiveTask: (taskId: string) => void;
  unarchiveTask: (taskId: string) => void;
  /** Runs one `lk` command against the same state the board renders and returns its printed output. */
  runCommand: (input: string) => string[];
}

/**
 * Owns the demo board's state, driven entirely by local React state -- no
 * CRDT, no IndexedDB, no network. The board and the terminal demo both read
 * from and write to this single source so dragging a card and typing `lk
 * start LK-2` are visibly the same action. All actual state transitions live
 * in workspaceActions.ts as pure functions; this hook is just the React shell.
 */
export function useDemoWorkspace(): DemoWorkspace {
  const [lanes] = useState<Lane[]>(() => DEMO_LANES);
  const [tasks, setTasks] = useState<Task[]>(() => buildInitialTasks());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const moveTask = useCallback((taskId: string, laneId: string, rank: string) => {
    setTasks((prev) => actions.moveTask(prev, taskId, laneId, rank));
  }, []);

  const addTask = useCallback((laneId: string, title: string) => {
    setTasks((prev) => actions.addTask(prev, laneId, title));
  }, []);

  const toggleTimer = useCallback((taskId: string) => {
    setTasks((prev) => actions.toggleTimer(prev, taskId));
  }, []);

  const archiveCompletedTasks = useCallback(
    (olderThanDays: number) => {
      const { tasks: nextTasks, count } = actions.archiveCompletedTasks(tasks, lanes, olderThanDays);
      setTasks(nextTasks);
      return count;
    },
    [tasks, lanes]
  );

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => actions.updateTask(prev, taskId, updates));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => actions.deleteTask(prev, taskId));
    setSelectedTask((prev) => (prev?.id === taskId ? null : prev));
  }, []);

  const duplicateTask = useCallback(
    (taskId: string): Task | null => {
      const { tasks: nextTasks, created } = actions.duplicateTask(tasks, taskId);
      setTasks(nextTasks);
      return created;
    },
    [tasks]
  );

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) => actions.toggleSubtask(prev, taskId, subtaskId));
  }, []);

  const addSubtask = useCallback((taskId: string, title: string) => {
    setTasks((prev) => actions.addSubtask(prev, taskId, title));
  }, []);

  const promoteSubtaskToTask = useCallback(
    (parentTaskId: string, subtaskId: string): Task | null => {
      const { tasks: nextTasks, created } = actions.promoteSubtaskToTask(tasks, parentTaskId, subtaskId);
      setTasks(nextTasks);
      return created;
    },
    [tasks]
  );

  const archiveTask = useCallback((taskId: string) => {
    setTasks((prev) => actions.archiveTask(prev, taskId));
  }, []);

  const unarchiveTask = useCallback((taskId: string) => {
    setTasks((prev) => actions.unarchiveTask(prev, taskId));
  }, []);

  const runCommand = useCallback(
    (input: string): string[] => {
      const outcome = runLkCommand(input, { tasks, lanes });
      if (outcome.effect) {
        const effect = outcome.effect;
        if (effect.type === 'create') {
          setTasks((prev) => [...prev, effect.task]);
        } else {
          setTasks((prev) => actions.updateTask(prev, effect.taskId, { laneId: effect.laneId }));
        }
      }
      return outcome.lines;
    },
    [tasks, lanes]
  );

  return {
    lanes,
    tasks,
    selectedTask,
    selectTask: setSelectedTask,
    toggleTimer,
    moveTask,
    addTask,
    archiveCompletedTasks,
    updateTask,
    deleteTask,
    duplicateTask,
    toggleSubtask,
    addSubtask,
    promoteSubtaskToTask,
    archiveTask,
    unarchiveTask,
    runCommand
  };
}
