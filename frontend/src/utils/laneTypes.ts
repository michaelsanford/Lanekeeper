import type { Lane, LaneType } from '../types/index.js';

/**
 * Behavior must key off Lane.type, never a hardcoded lane id — lane ids
 * differ per workflow template (see utils/templates.ts), so matching on a
 * literal id like 'done' or 'inprogress' silently breaks under any
 * non-default template.
 */

export function isTaskInLaneType(task: { laneId: string }, lanes: Lane[], type: LaneType): boolean {
  const lane = lanes.find((l) => l.id === task.laneId);
  return lane?.type === type;
}

/**
 * The first lane of the given type, in board order. Falls back to the
 * board's first lane overall if no lane of that type exists (a template
 * missing a core type entirely), matching the pre-existing "always land
 * somewhere valid" behavior for degenerate/custom templates.
 */
export function getFirstLaneIdByType(lanes: Lane[], type: LaneType): string | undefined {
  return lanes.find((l) => l.type === type)?.id ?? lanes[0]?.id;
}
