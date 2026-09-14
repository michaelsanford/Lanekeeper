import { describe, it, expect } from 'vitest';
import {
  parseRank,
  formatRank,
  getRankBefore,
  getRankAfter,
  getRankBetween,
  sortTasksByRank
} from '../src/utils/rank.js';
import type { Task } from '../src/types/index.js';

describe('Lexorank Fractional Indexing', () => {
  it('parses and formats rank envelopes', () => {
    expect(parseRank('0|100:')).toBe('100');
    expect(parseRank('0|h00000:')).toBe('h00000');
    expect(formatRank('100')).toBe('0|100:');
  });

  it('generates a rank before a given rank (head insertion)', () => {
    const before200 = getRankBefore('200');
    expect(before200 < '200').toBe(true);

    const before100 = getRankBefore('100');
    expect(before100 < '100').toBe(true);

    const before0i = getRankBefore('0i');
    expect(before0i < '0i').toBe(true);

    // Using getRankBetween
    const r1 = getRankBetween(undefined, '0|100:');
    expect(r1 < '0|100:').toBe(true);

    const r0 = getRankBetween(undefined, r1);
    expect(r0 < r1).toBe(true);
  });

  it('generates a rank after a given rank (tail insertion)', () => {
    const after100 = getRankAfter('100');
    expect(after100 > '100').toBe(true);

    const afterZ = getRankAfter('z');
    expect(afterZ > 'z').toBe(true);

    // Using getRankBetween
    const r1 = getRankBetween('0|100:', undefined);
    expect(r1 > '0|100:').toBe(true);

    const r2 = getRankBetween(r1, undefined);
    expect(r2 > r1).toBe(true);
  });

  it('generates intermediate ranks between two ranks (middle insertion)', () => {
    const rA = '0|100:';
    const rB = '0|200:';
    const mid = getRankBetween(rA, rB);

    expect(rA < mid).toBe(true);
    expect(mid < rB).toBe(true);

    // Repeated subdivisions
    let current = rA;
    for (let i = 0; i < 10; i++) {
      const next = getRankBetween(current, rB);
      expect(current < next).toBe(true);
      expect(next < rB).toBe(true);
      current = next;
    }
  });

  it('handles edge case when prev and next ranks are identical', () => {
    const rA = '0|100:';
    const rB = '0|100:';
    const result = getRankBetween(rA, rB);
    expect(result > rA).toBe(true);
  });

  it('sorts tasks strictly according to their rank', () => {
    const tasks: Task[] = [
      {
        id: 'task-3',
        key: 'LK-3',
        title: 'Task 3',
        description: '',
        priority: 'none',
        laneId: 'todo',
        rank: '0|300:',
        tags: [],
        subtasks: [],
        createdAt: '2026-09-14T00:00:00Z',
        updatedAt: '2026-09-14T00:00:00Z'
      },
      {
        id: 'task-1',
        key: 'LK-1',
        title: 'Task 1',
        description: '',
        priority: 'none',
        laneId: 'todo',
        rank: '0|100:',
        tags: [],
        subtasks: [],
        createdAt: '2026-09-14T00:00:00Z',
        updatedAt: '2026-09-14T00:00:00Z'
      },
      {
        id: 'task-2',
        key: 'LK-2',
        title: 'Task 2',
        description: '',
        priority: 'none',
        laneId: 'todo',
        rank: '0|200:',
        tags: [],
        subtasks: [],
        createdAt: '2026-09-14T00:00:00Z',
        updatedAt: '2026-09-14T00:00:00Z'
      }
    ];

    const sorted = sortTasksByRank(tasks);
    expect(sorted.map((t) => t.id)).toEqual(['task-1', 'task-2', 'task-3']);
  });

  it('reorders tasks within a swimlane using arrayMove and getRankBetween', () => {
    // Initial lane state: 3 tasks sorted by rank
    const tasks: Task[] = [
      {
        id: 'task-a',
        key: 'LK-1',
        title: 'Task A',
        description: '',
        priority: 'none',
        laneId: 'todo',
        rank: '0|100:',
        tags: [],
        subtasks: [],
        createdAt: '2026-09-14T00:00:00Z',
        updatedAt: '2026-09-14T00:00:00Z'
      },
      {
        id: 'task-b',
        key: 'LK-2',
        title: 'Task B',
        description: '',
        priority: 'none',
        laneId: 'todo',
        rank: '0|200:',
        tags: [],
        subtasks: [],
        createdAt: '2026-09-14T00:00:00Z',
        updatedAt: '2026-09-14T00:00:00Z'
      },
      {
        id: 'task-c',
        key: 'LK-3',
        title: 'Task C',
        description: '',
        priority: 'none',
        laneId: 'todo',
        rank: '0|300:',
        tags: [],
        subtasks: [],
        createdAt: '2026-09-14T00:00:00Z',
        updatedAt: '2026-09-14T00:00:00Z'
      }
    ];

    // Case 1: Drag task-c (index 2) to top (index 0)
    const oldIndex1 = 2;
    const overIndex1 = 0;
    const reordered1 = [tasks[2], tasks[0], tasks[1]];
    const prevTask1 = overIndex1 > 0 ? reordered1[overIndex1 - 1] : undefined;
    const nextTask1 = overIndex1 < reordered1.length - 1 ? reordered1[overIndex1 + 1] : undefined;
    const newRank1 = getRankBetween(prevTask1?.rank, nextTask1?.rank);

    tasks[2].rank = newRank1;
    const afterMoveToTop = sortTasksByRank(tasks);
    expect(afterMoveToTop.map((t) => t.id)).toEqual(['task-c', 'task-a', 'task-b']);

    // Case 2: Drag task-c from index 0 to index 1 (between task-a and task-b)
    const currentLane = sortTasksByRank(tasks);
    // current: [task-c, task-a, task-b]
    const reordered2 = [currentLane[1], currentLane[0], currentLane[2]]; // [task-a, task-c, task-b]
    const overIndex2 = 1;
    const prevTask2 = reordered2[overIndex2 - 1];
    const nextTask2 = reordered2[overIndex2 + 1];
    const newRank2 = getRankBetween(prevTask2?.rank, nextTask2?.rank);

    tasks.find((t) => t.id === 'task-c')!.rank = newRank2;
    const afterMoveToMiddle = sortTasksByRank(tasks);
    expect(afterMoveToMiddle.map((t) => t.id)).toEqual(['task-a', 'task-c', 'task-b']);

    // Case 3: Drag task-a from index 0 to bottom (index 2)
    const currentLane3 = sortTasksByRank(tasks);
    // current: [task-a, task-c, task-b]
    const reordered3 = [currentLane3[1], currentLane3[2], currentLane3[0]]; // [task-c, task-b, task-a]
    const overIndex3 = 2;
    const prevTask3 = reordered3[overIndex3 - 1];
    const nextTask3 = overIndex3 < reordered3.length - 1 ? reordered3[overIndex3 + 1] : undefined;
    const newRank3 = getRankBetween(prevTask3?.rank, nextTask3?.rank);

    tasks.find((t) => t.id === 'task-a')!.rank = newRank3;
    const afterMoveToBottom = sortTasksByRank(tasks);
    expect(afterMoveToBottom.map((t) => t.id)).toEqual(['task-c', 'task-b', 'task-a']);
  });
});

