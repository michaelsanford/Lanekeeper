import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { BoardFilterBar } from '../src/components/board/BoardFilterBar.js';
import { TaskCard } from '../src/components/board/TaskCard.js';
import type { Task } from '../src/types/index.js';

describe('BoardFilterBar Component', () => {
  it('renders search input, priority buttons, tag selector, and item counters', () => {
    const rawHtml = renderToString(
      React.createElement(BoardFilterBar, {
        searchQuery: '',
        onSearchChange: vi.fn(),
        selectedPriority: 'all',
        onPriorityChange: vi.fn(),
        selectedTag: 'all',
        onTagChange: vi.fn(),
        availableTags: ['frontend', 'backend'],
        totalCount: 12,
        filteredCount: 12,
        onResetFilters: vi.fn()
      })
    );
    const html = rawHtml.replace(/<!--.*?-->/g, '');

    // Search input placeholder
    expect(html).toContain('Search board (key, title, #tag)...');

    // Priority filter pills
    expect(html).toContain('All');
    expect(html).toContain('Urgent');
    expect(html).toContain('High');
    expect(html).toContain('Medium');
    expect(html).toContain('Low');

    // Tag selector
    expect(html).toContain('All Tags (2)');
    expect(html).toContain('#frontend');
    expect(html).toContain('#backend');

    // Counter without active filter
    expect(html).toContain('12');
    expect(html).toContain('total tasks');
  });

  it('renders filtered match counter and reset button when filters are active', () => {
    const rawHtml = renderToString(
      React.createElement(BoardFilterBar, {
        searchQuery: 'auth',
        onSearchChange: vi.fn(),
        selectedPriority: 'urgent',
        onPriorityChange: vi.fn(),
        selectedTag: 'backend',
        onTagChange: vi.fn(),
        availableTags: ['backend'],
        totalCount: 10,
        filteredCount: 2,
        onResetFilters: vi.fn()
      })
    );
    const html = rawHtml.replace(/<!--.*?-->/g, '');

    expect(html).toContain('Showing');
    expect(html).toContain('2');
    expect(html).toContain('of 10 tasks');
    expect(html).toContain('Reset');
  });
});

describe('Board Filtering Logic', () => {
  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      key: 'LK-101',
      title: 'Fix authentication session timeout',
      laneId: 'todo',
      priority: 'urgent',
      tags: ['auth', 'security'],
      subtasks: [
        { id: 's1', title: 'Verify token expiration', completed: true },
        { id: 's2', title: 'Handle refresh flow', completed: false }
      ],
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z'
    },
    {
      id: 'task-2',
      key: 'LK-102',
      title: 'Design high resolution swimlane icons',
      laneId: 'inprogress',
      priority: 'medium',
      tags: ['ui', 'design'],
      subtasks: [],
      createdAt: '2026-09-02T00:00:00.000Z',
      updatedAt: '2026-09-02T00:00:00.000Z'
    },
    {
      id: 'task-3',
      key: 'LK-103',
      title: 'Add database read replica pool',
      laneId: 'done',
      priority: 'urgent',
      tags: ['database', 'infra'],
      subtasks: [
        { id: 's3', title: 'Provision cluster', completed: true },
        { id: 's4', title: 'Update connection pool', completed: true }
      ],
      createdAt: '2026-09-03T00:00:00.000Z',
      updatedAt: '2026-09-03T00:00:00.000Z'
    }
  ];

  const filterTasks = (
    tasks: Task[],
    query: string,
    priority: string,
    tag: string
  ): Task[] => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (task.archived) return false;

      if (q) {
        const matchesKey = task.key.toLowerCase().includes(q);
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesTags = task.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesKey && !matchesTitle && !matchesTags) {
          return false;
        }
      }

      if (priority !== 'all' && task.priority !== priority) {
        return false;
      }

      if (tag !== 'all' && !task.tags.includes(tag)) {
        return false;
      }

      return true;
    });
  };

  it('filters tasks by search query across key, title, and tag', () => {
    // Match by key
    expect(filterTasks(sampleTasks, 'LK-102', 'all', 'all')).toHaveLength(1);
    expect(filterTasks(sampleTasks, 'LK-102', 'all', 'all')[0].id).toBe('task-2');

    // Match by title substring (case-insensitive)
    expect(filterTasks(sampleTasks, 'AUTHENTICATION', 'all', 'all')).toHaveLength(1);
    expect(filterTasks(sampleTasks, 'AUTHENTICATION', 'all', 'all')[0].id).toBe('task-1');

    // Match by tag
    expect(filterTasks(sampleTasks, 'infra', 'all', 'all')).toHaveLength(1);
    expect(filterTasks(sampleTasks, 'infra', 'all', 'all')[0].id).toBe('task-3');
  });

  it('filters tasks by priority and tag selectors', () => {
    // Urgent tasks
    const urgentTasks = filterTasks(sampleTasks, '', 'urgent', 'all');
    expect(urgentTasks).toHaveLength(2);

    // Urgent + tag
    const urgentAuth = filterTasks(sampleTasks, '', 'urgent', 'auth');
    expect(urgentAuth).toHaveLength(1);
    expect(urgentAuth[0].id).toBe('task-1');

    // Non-existent combination
    const lowTasks = filterTasks(sampleTasks, '', 'low', 'all');
    expect(lowTasks).toHaveLength(0);
  });
});

describe('TaskCard Subtask Visual Progress Bar', () => {
  const taskWithPartialSubtasks: Task = {
    id: 't-sub-1',
    key: 'LK-201',
    title: 'Component with partial progress',
    laneId: 'inprogress',
    priority: 'medium',
    tags: [],
    subtasks: [
      { id: 'st-1', title: 'One', completed: true },
      { id: 'st-2', title: 'Two', completed: false }
    ],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z'
  };

  const taskWithCompletedSubtasks: Task = {
    id: 't-sub-2',
    key: 'LK-202',
    title: 'Component with full progress',
    laneId: 'done',
    priority: 'high',
    tags: [],
    subtasks: [
      { id: 'st-3', title: 'Alpha', completed: true },
      { id: 'st-4', title: 'Beta', completed: true }
    ],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z'
  };

  const taskWithoutSubtasks: Task = {
    id: 't-sub-3',
    key: 'LK-203',
    title: 'Component with no subtasks',
    laneId: 'todo',
    priority: 'none',
    tags: [],
    subtasks: [],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z'
  };

  it('renders 50% width progress bar and ratio for half-completed checklist', () => {
    const rawHtml = renderToString(
      React.createElement(TaskCard, {
        task: taskWithPartialSubtasks,
        onSelect: vi.fn(),
        onToggleTimer: vi.fn()
      })
    );
    const html = rawHtml.replace(/<!--.*?-->/g, '');

    expect(html).toContain('width:50%');
    expect(html).toContain('1/2 (50%)');
    expect(html).toContain('bg-gradient-to-r from-indigo-500 to-indigo-400');
  });

  it('renders 100% width emerald progress bar for completed checklist', () => {
    const rawHtml = renderToString(
      React.createElement(TaskCard, {
        task: taskWithCompletedSubtasks,
        onSelect: vi.fn(),
        onToggleTimer: vi.fn()
      })
    );
    const html = rawHtml.replace(/<!--.*?-->/g, '');

    expect(html).toContain('width:100%');
    expect(html).toContain('2/2 (100%)');
    expect(html).toContain('bg-emerald-500');
  });

  it('does not render subtask progress bar when card has no subtasks', () => {
    const rawHtml = renderToString(
      React.createElement(TaskCard, {
        task: taskWithoutSubtasks,
        onSelect: vi.fn(),
        onToggleTimer: vi.fn()
      })
    );
    const html = rawHtml.replace(/<!--.*?-->/g, '');

    expect(html).not.toContain('rounded-full h-1.5');
  });
});
