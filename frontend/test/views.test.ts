import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { TableView } from '../src/components/table/TableView.js';
import { CalendarView } from '../src/components/calendar/CalendarView.js';
import type { Task, Lane } from '../src/types/index.js';

const mockLanes: Lane[] = [
  { id: 'triage', name: 'Triage', color: '#64748b', wipLimit: 0 },
  { id: 'in_progress', name: 'In Progress', color: '#3b82f6', wipLimit: 3 },
  { id: 'done', name: 'Done', color: '#10b981', wipLimit: 0 }
];

const mockTasks: Task[] = [
  {
    id: 'task-1',
    key: 'LANE-1',
    title: 'Implement database layer',
    laneId: 'in_progress',
    priority: 'high',
    dueDate: '2026-09-15',
    estimateMinutes: 120,
    timeSpentSeconds: 3600,
    isTimerRunning: true,
    subtasks: [
      { id: 'sub-1', title: 'Schema migration', completed: true },
      { id: 'sub-2', title: 'Connection pool', completed: false }
    ],
    tags: ['backend', 'database'],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'task-2',
    key: 'LANE-2',
    title: 'Design icon system',
    laneId: 'triage',
    priority: 'low',
    estimateMinutes: 60,
    timeSpentSeconds: 0,
    isTimerRunning: false,
    subtasks: [],
    tags: ['design'],
    createdAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z'
  },
  {
    id: 'task-3',
    key: 'LANE-3',
    title: 'Overdue release checklist',
    laneId: 'in_progress',
    priority: 'urgent',
    dueDate: '2020-01-01',
    estimateMinutes: 30,
    timeSpentSeconds: 0,
    isTimerRunning: false,
    subtasks: [],
    tags: ['release'],
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z'
  }
];

describe('TableView Component', () => {
  it('renders table headers, controls, and tasks', () => {
    const html = renderToString(
      React.createElement(TableView, {
        tasks: mockTasks,
        lanes: mockLanes,
        onSelectTask: vi.fn(),
        onToggleTimer: vi.fn(),
        onUpdateTask: vi.fn(),
        onAddTask: vi.fn()
      })
    );

    // Headers & controls
    expect(html).toContain('Filter tasks by key, title, or #tag...');
    expect(html).toContain('All Lanes');
    expect(html).toContain('All Priorities');
    expect(html).toContain('Key');
    expect(html).toContain('Title');
    expect(html).toContain('Status / Lane');
    expect(html).toContain('Priority');
    expect(html).toContain('Due Date');
    expect(html).toContain('Estimate');
    expect(html).toContain('Tags');
    expect(html).toContain('Actions');

    // Task rows
    expect(html).toContain('LANE-1');
    expect(html).toContain('Implement database layer');
    expect(html).toContain('1/2'); // Subtasks ratio
    expect(html).toContain('LANE-2');
    expect(html).toContain('Design icon system');

    // Status bar summary
    expect(html).toContain('active timer');
    expect(html).toContain('overdue');
  });

  it('renders empty state when task array is empty', () => {
    const html = renderToString(
      React.createElement(TableView, {
        tasks: [],
        lanes: mockLanes,
        onSelectTask: vi.fn(),
        onToggleTimer: vi.fn(),
        onUpdateTask: vi.fn(),
        onAddTask: vi.fn()
      })
    );

    expect(html).toContain('No tasks found');
    expect(html).toContain('Try changing your search query or filters.');
  });
});

describe('CalendarView Component', () => {
  it('renders calendar matrix, weekdays, and navigation controls', () => {
    const html = renderToString(
      React.createElement(CalendarView, {
        tasks: mockTasks,
        lanes: mockLanes,
        onSelectTask: vi.fn(),
        onAddTask: vi.fn()
      })
    );

    // Days of the week
    expect(html).toContain('Sun');
    expect(html).toContain('Mon');
    expect(html).toContain('Tue');
    expect(html).toContain('Wed');
    expect(html).toContain('Thu');
    expect(html).toContain('Fri');
    expect(html).toContain('Sat');

    // Navigation
    expect(html).toContain('Today');

    // Overdue tasks in sidebar (task-3 has 2020-01-01 dueDate)
    expect(html).toContain('Overdue Tasks');
    expect(html).toContain('LANE-3');
    expect(html).toContain('Overdue release checklist');

    // Unscheduled tasks in sidebar (task-2 has no dueDate)
    expect(html).toContain('Unscheduled');
    expect(html).toContain('LANE-2');
    expect(html).toContain('Design icon system');
  });

  it('renders empty unscheduled indicator when all tasks are scheduled', () => {
    const scheduledTasks = [mockTasks[0]];
    const html = renderToString(
      React.createElement(CalendarView, {
        tasks: scheduledTasks,
        lanes: mockLanes,
        onSelectTask: vi.fn(),
        onAddTask: vi.fn()
      })
    );

    expect(html).toContain('All active tasks are scheduled with due dates.');
  });
});
