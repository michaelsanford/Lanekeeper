import type { Task, Lane } from '../../../frontend/src/types/index.js';
import { parseQuickTask } from '../../../frontend/src/utils/parser.js';
import { getRankBetween, sortTasksByRank } from '../../../frontend/src/utils/rank.js';
import { getFirstLaneIdByType } from '../../../frontend/src/utils/laneTypes.js';

/**
 * Reimplements the client-visible behavior of cli/lk.mjs -- the same command
 * surface and the exact plain-text output copy -- against in-browser demo
 * state instead of a real HTTP backend. No network call is made; there is no
 * "[Local Mode]" branch here because the demo has no backend to fail to reach.
 * lk.mjs emits no ANSI color, and neither does this.
 */

export interface LkWorkspaceState {
  tasks: Task[];
  lanes: Lane[];
}

export type LkEffect =
  | { type: 'create'; task: Task }
  | { type: 'transition'; taskId: string; laneId: string };

export interface LkCommandOutcome {
  lines: string[];
  effect?: LkEffect;
}

const BANNER = [
  '',
  'Lanekeeper CLI (lk) - Developer Task & Flight Deck Companion',
  '',
  'Usage:',
  '  lk add "<text>"      Quickly ingest task with token syntax (#tag !prio ^due ~est)',
  '  lk list              List tasks from the connected Lanekeeper project',
  '  lk start <KEY>       Transition card to In Progress and show branch command',
  '  lk close <KEY>       Mark task complete',
  '',
  'Set LANEKEEPER_API_URL and LANEKEEPER_API_TOKEN to connect to your backend.',
  ''
];

function formatTaskLine(task: Task): string {
  const due = task.dueDate ? ` (due ${task.dueDate})` : '';
  const est = task.estimateMinutes ? ` (~${task.estimateMinutes}m)` : '';
  return `  ${task.key.padEnd(8)}[${task.laneId}] ${task.title}${due}${est}`;
}

export function runLkCommand(rawInput: string, state: LkWorkspaceState): LkCommandOutcome {
  const argv = rawInput.trim().split(/\s+/).filter(Boolean);
  // The terminal prompt shows the full shell-style invocation (`$ lk list`), and a
  // visitor typing at the live prompt naturally does the same -- accept the command
  // with or without the leading binary name, unlike lk.mjs's own argv handling
  // (which never sees "lk" since the OS shell already stripped it).
  if (argv[0]?.toLowerCase() === 'lk') {
    argv.shift();
  }
  const command = (argv[0] || '').toLowerCase();
  const rest = argv.slice(1);

  switch (command) {
    case 'add': {
      // A real shell strips the surrounding quotes from `lk add "<text>"` before the
      // program ever sees argv; this fake terminal has no shell to do that for us.
      let text = rest.join(' ');
      if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
        text = text.slice(1, -1);
      }
      if (!text) {
        return {
          lines: ['Error: Please provide task text.', "Example: lk add 'Fix cache header !urgent #infra'"]
        };
      }

      const parsed = parseQuickTask(text);
      const laneId = getFirstLaneIdByType(state.lanes, 'backlog') ?? state.lanes[0]?.id ?? 'triage';
      const laneTasks = sortTasksByRank(state.tasks.filter((t) => t.laneId === laneId));
      const rank = getRankBetween(laneTasks[laneTasks.length - 1]?.rank, undefined);
      const now = new Date().toISOString();
      const key = `LK-${state.tasks.length + 1}`;

      const task: Task = {
        id: key,
        key,
        title: parsed.title,
        description: '',
        priority: parsed.priority,
        laneId,
        rank,
        tags: parsed.tags,
        subtasks: [],
        dueDate: parsed.dueDate,
        estimateMinutes: parsed.estimateMinutes,
        assigneeId: parsed.assignee,
        createdAt: now,
        updatedAt: now
      };

      return {
        lines: ['', `Ingested task: [${task.key}] ${task.title}`, `  Lane: ${task.laneId} | Priority: ${task.priority}`, ''],
        effect: { type: 'create', task }
      };
    }

    case 'list': {
      if (state.tasks.length === 0) {
        return {
          lines: ['', 'Lanekeeper Flight Deck (Terminal View)', '', '  No tasks yet. Run `lk add "<text>"` to capture one.', '']
        };
      }
      const rows = sortTasksByRank(state.tasks).map(formatTaskLine);
      return {
        lines: [
          '',
          'Lanekeeper Flight Deck (Terminal View)',
          '',
          ...rows,
          '',
          'Run `lk start <KEY>` to begin work, or `lk close <KEY>` to finish.',
          ''
        ]
      };
    }

    case 'start':
    case 'close':
    case 'done': {
      const verb = command === 'start' ? 'start' : 'close';
      const key = (rest[0] || '').toUpperCase();
      if (!key) {
        return { lines: [`Error: Please provide task key (e.g. lk ${verb} LK-42)`] };
      }

      const task = state.tasks.find((t) => t.key === key);
      if (!task) {
        return { lines: [`Error: Task ${key} not found`] };
      }

      if (verb === 'start') {
        // lk.mjs hardcodes the software-dev template's lane ids, same as this demo board.
        const laneId = 'inprogress';
        return {
          lines: [
            '',
            `Starting ${task.key}: ${task.title}`,
            `  Lane: ${laneId}`,
            '',
            'Suggested git command:',
            `  git checkout -b feature/${task.key.toLowerCase()}-task`,
            ''
          ],
          effect: { type: 'transition', taskId: task.id, laneId }
        };
      }

      const laneId = 'done';
      return {
        lines: ['', `Closing ${task.key}: ${task.title}`, `  Lane: ${laneId}`, ''],
        effect: { type: 'transition', taskId: task.id, laneId }
      };
    }

    default:
      return { lines: BANNER };
  }
}
