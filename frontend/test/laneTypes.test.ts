import { describe, it, expect } from 'vitest';
import { isTaskInLaneType, getFirstLaneIdByType } from '../src/utils/laneTypes.js';
import type { Lane } from '../src/types/index.js';

const lanes: Lane[] = [
  { id: 'backlog-a', name: 'Backlog', color: '#000', type: 'backlog' },
  { id: 'wip-a', name: 'Doing', color: '#000', type: 'started' },
  { id: 'wip-b', name: 'Reviewing', color: '#000', type: 'started' },
  { id: 'shipped', name: 'Shipped', color: '#000', type: 'completed' }
];

describe('isTaskInLaneType', () => {
  it('matches a task whose lane has the given type', () => {
    expect(isTaskInLaneType({ laneId: 'shipped' }, lanes, 'completed')).toBe(true);
    expect(isTaskInLaneType({ laneId: 'wip-a' }, lanes, 'started')).toBe(true);
  });

  it('does not match a task whose lane has a different type', () => {
    expect(isTaskInLaneType({ laneId: 'wip-a' }, lanes, 'completed')).toBe(false);
  });

  it('returns false for a task whose laneId does not exist in the given lanes (e.g. a stale/foreign template id)', () => {
    expect(isTaskInLaneType({ laneId: 'nonexistent' }, lanes, 'completed')).toBe(false);
  });

  it('works correctly across a non-default set of lane ids, proving no hardcoded id dependency', () => {
    const customLanes: Lane[] = [
      { id: 'custom-done-lane-xyz', name: 'Done', color: '#000', type: 'completed' }
    ];
    expect(isTaskInLaneType({ laneId: 'custom-done-lane-xyz' }, customLanes, 'completed')).toBe(true);
  });
});

describe('getFirstLaneIdByType', () => {
  it('returns the first lane of the requested type, in board order', () => {
    expect(getFirstLaneIdByType(lanes, 'started')).toBe('wip-a');
    expect(getFirstLaneIdByType(lanes, 'completed')).toBe('shipped');
  });

  it('falls back to the first lane overall when no lane of that type exists', () => {
    expect(getFirstLaneIdByType(lanes, 'cancelled')).toBe('backlog-a');
  });

  it('returns undefined when there are no lanes at all', () => {
    expect(getFirstLaneIdByType([], 'backlog')).toBeUndefined();
  });
});
