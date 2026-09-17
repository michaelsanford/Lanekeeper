import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { crdtStore } from '../src/crdt/doc.js';
import {
  isFeatureEnabled,
  setFeatureFlag,
  getArchiveThresholdDays,
  setArchiveThresholdDays,
  resetAllFeatureFlags
} from '../src/features/engine.js';
import { TableView } from '../src/components/table/TableView.js';
import type { Task, Lane } from '../src/types/index.js';

describe('Task Archiving & Retention Engine', () => {
  beforeEach(() => {
    crdtStore.ensureDefaultLanes();
    resetAllFeatureFlags();
  });

  it('archives and unarchives an individual task in CRDT store', () => {
    const task = crdtStore.addTask({
      title: 'Task to be archived',
      laneId: 'done',
      priority: 'medium'
    });

    expect(task.archived).toBeUndefined();

    // Archive the task
    crdtStore.archiveTask(task.id);
    let updated = crdtStore.getTasks().find((t) => t.id === task.id);
    expect(updated?.archived).toBe(true);
    expect(updated?.archivedAt).toBeDefined();

    // Unarchive the task
    crdtStore.unarchiveTask(task.id);
    updated = crdtStore.getTasks().find((t) => t.id === task.id);
    expect(updated?.archived).toBe(false);
    expect(updated?.archivedAt).toBeUndefined();
  });

  it('stops running timer when a task is archived', () => {
    const task = crdtStore.addTask({
      title: 'Task with active timer',
      laneId: 'inprogress'
    });

    crdtStore.toggleTimer(task.id);
    let current = crdtStore.getTasks().find((t) => t.id === task.id);
    expect(current?.isTimerRunning).toBe(true);

    crdtStore.archiveTask(task.id);
    current = crdtStore.getTasks().find((t) => t.id === task.id);
    expect(current?.archived).toBe(true);
    expect(current?.isTimerRunning).toBe(false);
  });

  it('archives completed tasks older than threshold days', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const oldDoneTask = crdtStore.addTask({
      title: 'Old Done Task',
      laneId: 'done'
    });
    // Manually set createdAt and updatedAt to simulate older completion
    crdtStore.updateTask(oldDoneTask.id, { createdAt: tenDaysAgo, updatedAt: tenDaysAgo });

    const recentDoneTask = crdtStore.addTask({
      title: 'Recent Done Task',
      laneId: 'done'
    });
    crdtStore.updateTask(recentDoneTask.id, { createdAt: twoDaysAgo, updatedAt: twoDaysAgo });

    const inProgressTask = crdtStore.addTask({
      title: 'Old In Progress Task',
      laneId: 'inprogress'
    });
    crdtStore.updateTask(inProgressTask.id, { createdAt: tenDaysAgo, updatedAt: tenDaysAgo });

    // Run archive with 7 day retention threshold
    const archivedCount = crdtStore.archiveCompletedTasks(7);
    expect(archivedCount).toBe(1);

    const tasks = crdtStore.getTasks();
    const oldDone = tasks.find((t) => t.id === oldDoneTask.id);
    const recentDone = tasks.find((t) => t.id === recentDoneTask.id);
    const inProgress = tasks.find((t) => t.id === inProgressTask.id);

    expect(oldDone?.archived).toBe(true);
    expect(oldDone?.archivedAt).toBeDefined();
    expect(recentDone?.archived).toBeFalsy();
    expect(inProgress?.archived).toBeFalsy();
  });

  it('manages doneLaneArchiving feature gate and configurable threshold days', () => {
    // Feature gate defaults to false (disabled)
    expect(isFeatureEnabled('doneLaneArchiving')).toBe(false);

    setFeatureFlag('doneLaneArchiving', true);
    expect(isFeatureEnabled('doneLaneArchiving')).toBe(true);

    // Default threshold is 7 days
    expect(getArchiveThresholdDays()).toBe(7);

    // Configurable retention
    setArchiveThresholdDays(14);
    expect(getArchiveThresholdDays()).toBe(14);

    setArchiveThresholdDays(30);
    expect(getArchiveThresholdDays()).toBe(30);

    // Supports 0 days (archive immediately)
    setArchiveThresholdDays(0);
    expect(getArchiveThresholdDays()).toBe(0);
  });
});

describe('TableView Archival Display and Recovery', () => {
  const testLanes: Lane[] = [
    { id: 'done', name: 'Done', color: '#10b981', wipLimit: 0, type: 'completed' }
  ];

  const testTasks: Task[] = [
    {
      id: 'task-active',
      key: 'TEST-1',
      title: 'Active finished task',
      laneId: 'done',
      priority: 'low',
      archived: false,
      tags: ['ship'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task-archived',
      key: 'TEST-2',
      title: 'Historical archived task',
      laneId: 'done',
      priority: 'high',
      archived: true,
      archivedAt: new Date().toISOString(),
      tags: ['archive'],
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 86400000).toISOString()
    }
  ];

  it('renders archive toggle chip when archived tasks exist', () => {
    const rawHtml = renderToString(
      React.createElement(TableView, {
        tasks: testTasks,
        lanes: testLanes,
        onSelectTask: () => {},
        onToggleTimer: () => {},
        onUpdateTask: () => {},
        onAddTask: () => {},
        onUnarchiveTask: () => {}
      })
    );
    const html = rawHtml.split('<!-- -->').join('');

    // Active view shows only active task by default
    expect(html).toContain('Active finished task');
    expect(html).not.toContain('Historical archived task');

    // Archive toggle button is present with count 1
    expect(html).toContain('Archived (1)');
  });
});
