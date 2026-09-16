import type { Task } from '../types/index.js';

export interface SampleTaskSpec {
  title: string;
  description?: string;
  priority: Task['priority'];
  laneId: string;
  estimateMinutes?: number;
  tags: string[];
  dueDate?: string;
}

export const SAMPLE_TASK_SPECS: SampleTaskSpec[] = [
  {
    title: 'Architect local-first CRDT sync layer',
    description: 'Design stateless document diff exchange using yjs binary states.',
    priority: 'urgent',
    laneId: 'inprogress',
    estimateMinutes: 240,
    tags: ['architecture', 'crdt']
  },
  {
    title: 'Configure AWS Cognito with software TOTP MFA',
    description: 'Enforce hardware/software TOTP MFA on user pool.',
    priority: 'high',
    laneId: 'todo',
    estimateMinutes: 120,
    tags: ['security', 'cognito']
  },
  {
    title: 'Build Flight Deck focus view and timer',
    description: 'Focus cockpit showing only 1-3 critical tasks in flight.',
    priority: 'urgent',
    laneId: 'inprogress',
    estimateMinutes: 180,
    tags: ['ui', 'focus']
  },
  {
    title: 'Implement Web Speech API voice task dictation',
    description: 'On-device browser speech recognition for hands-free task capture.',
    priority: 'medium',
    laneId: 'triage',
    estimateMinutes: 60,
    tags: ['pwa', 'voice']
  },
  {
    title: 'Set up EventBridge due-date reminder push cron',
    description: '5-minute EventBridge cron rule to dispatch RFC 8291 Web Push notifications.',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    laneId: 'todo',
    estimateMinutes: 120,
    tags: ['infra', 'push']
  }
];
