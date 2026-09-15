import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { LaneColumn } from '../src/components/board/LaneColumn.js';
import { FlightDeckView } from '../src/components/flightdeck/FlightDeckView.js';
import { ProjectSettingsModal } from '../src/components/project/ProjectSettingsModal.js';
import { TaskCard } from '../src/components/board/TaskCard.js';
import { BoardFilterBar } from '../src/components/board/BoardFilterBar.js';
import { crdtStore } from '../src/crdt/doc.js';
import type { Task, Lane, ProjectMetadata } from '../src/types/index.js';

describe('Simple PM Features and Flow State Redesign', () => {
  const baseLane: Lane = {
    id: 'lane-1',
    name: 'In Progress',
    color: '#3b82f6',
    type: 'started'
  };

  const baseTask: Task = {
    id: 'task-1',
    key: 'LK-100',
    title: 'Migrate sync layer to CRDT',
    description: 'Detailed description',
    priority: 'high',
    laneId: 'lane-1',
    rank: '0|hzzzzz:',
    tags: ['crdt', 'sync'],
    subtasks: [{ id: 'st-1', title: 'Write tests', completed: true }],
    timeSpentSeconds: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  describe('LaneColumn Flow State and Capacity Pill', () => {
    it('does not render traffic light when lane has no WIP limit', () => {
      const html = renderToString(
        <LaneColumn
          lane={{ ...baseLane, wipLimit: undefined }}
          tasks={[baseTask]}
          onSelectTask={vi.fn()}
          onToggleTimer={vi.fn()}
          onAddTask={vi.fn()}
        />
      );

      // No traffic light signal casing or visors
      expect(html).not.toContain('Flow State:');
      expect(html).not.toContain('Signal Casing');
      // Lane name and count are present
      expect(html).toContain('In Progress');
      expect(html).toContain('1');
    });

    it('renders modern capacity pill when lane has WIP limit', () => {
      const html = renderToString(
        <LaneColumn
          lane={{ ...baseLane, wipLimit: 5 }}
          tasks={[baseTask]}
          onSelectTask={vi.fn()}
          onToggleTimer={vi.fn()}
          onAddTask={vi.fn()}
        />
      );

      // Contains capacity pill format
      expect(html).toContain('1/5');
      expect(html).toContain('Lane Flow Capacity: 1/5');
      expect(html).toContain('rounded-full');
      expect(html).toContain('bg-emerald-400');
    });

    it('renders warning styles when WIP limit is exceeded', () => {
      const task2 = { ...baseTask, id: 'task-2', key: 'LK-101' };
      const html = renderToString(
        <LaneColumn
          lane={{ ...baseLane, wipLimit: 1 }}
          tasks={[baseTask, task2]}
          onSelectTask={vi.fn()}
          onToggleTimer={vi.fn()}
          onAddTask={vi.fn()}
        />
      );

      expect(html).toContain('2/1');
      expect(html).toContain('Exceeded - Stop');
      expect(html).toContain('bg-rose-400');
      expect(html).toContain('animate-pulse');
    });
  });

  describe('FlightDeckView Modern Focus Indicator', () => {
    it('renders modern WIP capacity pill without traffic light', () => {
      const html = renderToString(
        <FlightDeckView
          tasks={[{ ...baseTask, laneId: 'inprogress' }]}
          onSelectTask={vi.fn()}
          onToggleTimer={vi.fn()}
          onCompleteTask={vi.fn()}
          onOpenQuickCapture={vi.fn()}
          onCreateTaskFromScratchpad={vi.fn()}
        />
      );

      expect(html).toContain('In Lane');
      expect(html).toContain('1/3 WIP');
      expect(html).not.toContain('Traffic Flow:');
      expect(html).toContain('rounded-full');
    });
  });

  describe('ProjectSettingsModal Workflow Stage Icons', () => {
    it('renders semantic stage icons for workflow lanes instead of traffic light', () => {
      const mockMeta: ProjectMetadata = {
        id: 'default',
        name: 'Lanekeeper Core',
        prefix: 'LK'
      };

      const html = renderToString(
        <ProjectSettingsModal
          isOpen={true}
          onClose={vi.fn()}
          metadata={mockMeta}
          lanes={[
            { id: 'b1', name: 'Backlog', color: '#64748b', type: 'backlog' },
            { id: 'u1', name: 'Ready', color: '#3b82f6', type: 'unstarted' },
            { id: 's1', name: 'Active', color: '#f59e0b', type: 'started' },
            { id: 'c1', name: 'Done', color: '#10b981', type: 'completed' },
            { id: 'x1', name: 'Cancelled', color: '#475569', type: 'cancelled' }
          ]}
          projectsList={[mockMeta]}
          onUpdateMetadata={vi.fn()}
          onAddLane={vi.fn()}
          onUpdateLane={vi.fn()}
          onDeleteLane={vi.fn()}
          onCreateProject={vi.fn()}
          onSwitchProject={vi.fn()}
          initialTab="lanes"
        />
      );

      expect(html).toContain('title="Backlog Stage"');
      expect(html).toContain('title="Unstarted Stage"');
      expect(html).toContain('title="Started / In-Progress Stage"');
      expect(html).toContain('title="Completed Stage"');
      expect(html).toContain('title="Cancelled Stage"');
      expect(html).not.toContain('Flow Signal:');
    });
  });

  describe('TaskCard Kind Badges and Blocked State', () => {
    it('renders blocked badge and banner with blocker explanation', () => {
      const blockedTask: Task = {
        ...baseTask,
        isBlocked: true,
        blockedReason: 'Waiting for security review on oauth tokens'
      };

      const html = renderToString(
        <TaskCard
          task={blockedTask}
          onSelect={vi.fn()}
          onToggleTimer={vi.fn()}
        />
      );

      expect(html).toContain('Blocked');
      expect(html).toContain('Blocker:');
      expect(html).toContain('Waiting for security review on oauth tokens');
      expect(html).toContain('border-l-4 border-l-amber-500');
    });

    it('renders Bug badge when kind is bug or tag is bug', () => {
      const bugTask: Task = {
        ...baseTask,
        kind: 'bug'
      };

      const html = renderToString(
        <TaskCard
          task={bugTask}
          onSelect={vi.fn()}
          onToggleTimer={vi.fn()}
        />
      );

      expect(html).toContain('Bug');
      expect(html).toContain('bg-rose-950/60');
    });

    it('renders Feature badge when kind is feature or tag is feature', () => {
      const featTask: Task = {
        ...baseTask,
        tags: ['feature', 'ui']
      };

      const html = renderToString(
        <TaskCard
          task={featTask}
          onSelect={vi.fn()}
          onToggleTimer={vi.fn()}
        />
      );

      expect(html).toContain('Feat');
      expect(html).toContain('bg-purple-950/60');
    });

    it('renders Chore badge when kind is chore or tag is chore', () => {
      const choreTask: Task = {
        ...baseTask,
        kind: 'chore'
      };

      const html = renderToString(
        <TaskCard
          task={choreTask}
          onSelect={vi.fn()}
          onToggleTimer={vi.fn()}
        />
      );

      expect(html).toContain('Chore');
      expect(html).toContain('bg-slate-800/60');
    });
  });

  describe('crdtStore duplicateTask', () => {
    it('duplicates task with fresh id, key, reset timer, and copy label', () => {
      const original = crdtStore.addTask({
        title: 'Original Task',
        priority: 'high',
        tags: ['test'],
        subtasks: [{ id: 'st-orig', title: 'Subtask 1', completed: true }]
      });

      const duplicated = crdtStore.duplicateTask(original.id);
      expect(duplicated).not.toBeNull();
      expect(duplicated!.id).not.toBe(original.id);
      expect(duplicated!.key).not.toBe(original.key);
      expect(duplicated!.title).toBe('Original Task (Copy)');
      expect(duplicated!.timeSpentSeconds).toBe(0);
      expect(duplicated!.isTimerRunning).toBe(false);
      expect(duplicated!.subtasks.length).toBe(1);
      expect(duplicated!.subtasks[0].completed).toBe(false);
      expect(duplicated!.tags).toEqual(['test']);
    });
  });

  describe('BoardFilterBar Simple PM Controls', () => {
    it('renders blocked filter toggle when blockedCount > 0 and copy markdown button', () => {
      const onCopyMock = vi.fn();
      const html = renderToString(
        <BoardFilterBar
          searchQuery=""
          onSearchChange={vi.fn()}
          selectedPriority="all"
          onPriorityChange={vi.fn()}
          selectedTag="all"
          onTagChange={vi.fn()}
          onlyBlocked={false}
          onToggleOnlyBlocked={vi.fn()}
          blockedCount={3}
          availableTags={['backend', 'frontend']}
          totalCount={10}
          filteredCount={10}
          onResetFilters={vi.fn()}
          onCopyMarkdown={onCopyMock}
        />
      );

      expect(html).toContain('Blocked (3)');
      expect(html).toContain('Copy Markdown');
    });
  });
});
