import type { Task, Lane } from '../../../frontend/src/types/index.js';
import { getWorkflowTemplate, DEFAULT_TEMPLATE_ID } from '../../../frontend/src/utils/templates.js';
import { SAMPLE_TASK_SPECS } from '../../../frontend/src/utils/sampleTasks.js';
import { getRankBetween } from '../../../frontend/src/utils/rank.js';

const template = getWorkflowTemplate(DEFAULT_TEMPLATE_ID);

/** The real "Software Engineering" workflow template's lanes, unmodified. */
export const DEMO_LANES: Lane[] = template.lanes.map((lane) => ({
  id: lane.id,
  name: lane.name,
  color: lane.color,
  type: lane.type,
  wipLimit: lane.wipLimit,
  icon: lane.icon
}));

/**
 * Seed content for the live demo board, built from the product's own
 * SAMPLE_TASK_SPECS (frontend/src/utils/sampleTasks.ts) -- the same fixtures
 * CrdtStore.seedSampleTasks() uses for a freshly created project. A couple of
 * tasks are lightly embellished (blocked state, subtasks) purely to show more
 * of the card's visual language in one screenful.
 */
export function buildInitialTasks(): Task[] {
  const now = Date.now();
  const lastRankByLane = new Map<string, string | undefined>();

  const tasks: Task[] = SAMPLE_TASK_SPECS.map((spec, index) => {
    const prevRank = lastRankByLane.get(spec.laneId);
    const rank = getRankBetween(prevRank, undefined);
    lastRankByLane.set(spec.laneId, rank);
    const createdAt = new Date(now - (SAMPLE_TASK_SPECS.length - index) * 3_600_000).toISOString();
    const key = `LK-${index + 1}`;

    return {
      id: key,
      key,
      title: spec.title,
      description: spec.description ?? '',
      priority: spec.priority,
      laneId: spec.laneId,
      rank,
      tags: [...spec.tags],
      subtasks: [],
      estimateMinutes: spec.estimateMinutes,
      dueDate: spec.dueDate,
      createdAt,
      updatedAt: createdAt
    };
  });

  const flightDeck = tasks.find((t) => t.title.startsWith('Build Flight Deck'));
  if (flightDeck) {
    flightDeck.kind = 'feature';
    flightDeck.subtasks = [
      { id: 's1', title: 'Cockpit layout', completed: true },
      { id: 's2', title: 'Stopwatch controls', completed: true },
      { id: 's3', title: 'Overdue alerts', completed: false }
    ];
  }

  const cognito = tasks.find((t) => t.title.startsWith('Configure AWS Cognito'));
  if (cognito) {
    cognito.isBlocked = true;
    cognito.blockedReason = 'Waiting on AWS support ticket for MFA quota increase';
  }

  return tasks;
}
