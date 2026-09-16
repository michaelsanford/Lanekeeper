import { describe, it, expect } from 'vitest';
import * as actions from '../src/demo/workspaceActions.js';
import { DEMO_LANES, buildInitialTasks } from '../src/demo/demoData.js';
import type { Task } from '../../frontend/src/types/index.js';

function freshTasks(): Task[] {
  return buildInitialTasks();
}

describe('workspaceActions', () => {
  it('moveTask updates laneId and rank without touching other tasks', () => {
    const tasks = freshTasks();
    const next = actions.moveTask(tasks, 'LK-1', 'done', '0|zzzzzz:');
    const moved = next.find((t) => t.id === 'LK-1')!;
    expect(moved.laneId).toBe('done');
    expect(moved.rank).toBe('0|zzzzzz:');
    expect(next.find((t) => t.id === 'LK-2')).toEqual(tasks.find((t) => t.id === 'LK-2'));
  });

  it('addTask appends a new task with an incremented key and no tags/priority', () => {
    const tasks = freshTasks();
    const next = actions.addTask(tasks, 'triage', 'A brand new task');
    expect(next).toHaveLength(tasks.length + 1);
    const created = next.at(-1)!;
    expect(created.title).toBe('A brand new task');
    expect(created.key).toBe(`LK-${tasks.length + 1}`);
    expect(created.laneId).toBe('triage');
    expect(created.priority).toBe('none');
  });

  it('toggleTimer flips isTimerRunning and sets/clears timerStartedAt', () => {
    const tasks = freshTasks();
    const started = actions.toggleTimer(tasks, 'LK-1');
    expect(started.find((t) => t.id === 'LK-1')!.isTimerRunning).toBe(true);
    expect(started.find((t) => t.id === 'LK-1')!.timerStartedAt).toBeTypeOf('number');

    const stopped = actions.toggleTimer(started, 'LK-1');
    expect(stopped.find((t) => t.id === 'LK-1')!.isTimerRunning).toBe(false);
    expect(stopped.find((t) => t.id === 'LK-1')!.timerStartedAt).toBeUndefined();
  });

  it('archiveCompletedTasks only archives completed-lane tasks past the threshold', () => {
    const tasks = freshTasks();
    const old = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const withDoneTask: Task[] = [
      ...tasks,
      {
        id: 'LK-old',
        key: 'LK-old',
        title: 'Ancient shipped task',
        description: '',
        priority: 'none',
        laneId: 'done',
        rank: '0|zzzzzz:',
        tags: [],
        subtasks: [],
        createdAt: old,
        updatedAt: old
      }
    ];

    const { tasks: nextTasks, count } = actions.archiveCompletedTasks(withDoneTask, DEMO_LANES, 7);
    expect(count).toBe(1);
    expect(nextTasks.find((t) => t.id === 'LK-old')!.archived).toBe(true);
    // Tasks in non-completed lanes are untouched regardless of age.
    expect(nextTasks.find((t) => t.id === 'LK-1')!.archived).toBeUndefined();
  });

  it('updateTask merges a partial update and bumps updatedAt', () => {
    const tasks = freshTasks();
    const before = tasks.find((t) => t.id === 'LK-1')!.updatedAt;
    const next = actions.updateTask(tasks, 'LK-1', { title: 'Renamed' });
    const updated = next.find((t) => t.id === 'LK-1')!;
    expect(updated.title).toBe('Renamed');
    expect(updated.updatedAt).not.toBe(before);
  });

  it('deleteTask removes exactly the targeted task', () => {
    const tasks = freshTasks();
    const next = actions.deleteTask(tasks, 'LK-1');
    expect(next).toHaveLength(tasks.length - 1);
    expect(next.find((t) => t.id === 'LK-1')).toBeUndefined();
  });

  it('duplicateTask clones a task with a fresh id/key and reset timer/subtask state', () => {
    const tasks = freshTasks();
    const { tasks: nextTasks, created } = actions.duplicateTask(tasks, 'LK-3');
    expect(created).not.toBeNull();
    expect(created!.title).toBe(`${tasks.find((t) => t.id === 'LK-3')!.title} (Copy)`);
    expect(created!.id).not.toBe('LK-3');
    expect(created!.timeSpentSeconds).toBe(0);
    expect(created!.isTimerRunning).toBe(false);
    expect(nextTasks).toHaveLength(tasks.length + 1);
  });

  it('duplicateTask is a no-op for an unknown id', () => {
    const tasks = freshTasks();
    const { tasks: nextTasks, created } = actions.duplicateTask(tasks, 'nope');
    expect(created).toBeNull();
    expect(nextTasks).toBe(tasks);
  });

  it('toggleSubtask and addSubtask operate on the right task only', () => {
    const tasks = freshTasks();
    const withNew = actions.addSubtask(tasks, 'LK-1', '  A new checklist item  ');
    const task1 = withNew.find((t) => t.id === 'LK-1')!;
    expect(task1.subtasks.at(-1)!.title).toBe('A new checklist item');
    expect(task1.subtasks.at(-1)!.completed).toBe(false);

    const subtaskId = task1.subtasks.at(-1)!.id;
    const toggled = actions.toggleSubtask(withNew, 'LK-1', subtaskId);
    expect(toggled.find((t) => t.id === 'LK-1')!.subtasks.at(-1)!.completed).toBe(true);
  });

  it('addSubtask ignores blank titles', () => {
    const tasks = freshTasks();
    const next = actions.addSubtask(tasks, 'LK-1', '   ');
    expect(next).toBe(tasks);
  });

  it('promoteSubtaskToTask moves a subtask into its own task in the parent lane', () => {
    const tasks = freshTasks();
    const flightDeck = tasks.find((t) => t.title.startsWith('Build Flight Deck'))!;
    const subtaskId = flightDeck.subtasks[0]!.id;

    const { tasks: nextTasks, created } = actions.promoteSubtaskToTask(tasks, flightDeck.id, subtaskId);
    expect(created).not.toBeNull();
    expect(created!.title).toBe(flightDeck.subtasks[0]!.title);
    expect(created!.laneId).toBe(flightDeck.laneId);

    const updatedParent = nextTasks.find((t) => t.id === flightDeck.id)!;
    expect(updatedParent.subtasks.find((st) => st.id === subtaskId)).toBeUndefined();
    expect(nextTasks).toHaveLength(tasks.length + 1);
  });

  it('archiveTask captures elapsed timer time and stops the timer', () => {
    const tasks = freshTasks();
    const running = actions.toggleTimer(tasks, 'LK-1');
    const archived = actions.archiveTask(running, 'LK-1');
    const task = archived.find((t) => t.id === 'LK-1')!;
    expect(task.archived).toBe(true);
    expect(task.isTimerRunning).toBe(false);
    expect(task.timerStartedAt).toBeUndefined();
    expect(task.timeSpentSeconds).toBeGreaterThanOrEqual(0);
  });

  it('unarchiveTask clears archived state', () => {
    const tasks = freshTasks();
    const archived = actions.archiveTask(tasks, 'LK-1');
    const unarchived = actions.unarchiveTask(archived, 'LK-1');
    const task = unarchived.find((t) => t.id === 'LK-1')!;
    expect(task.archived).toBe(false);
    expect(task.archivedAt).toBeUndefined();
  });
});
