import { describe, it, expect } from 'vitest';
import { runLkCommand } from '../src/demo/lkCommand.js';
import { DEMO_LANES, buildInitialTasks } from '../src/demo/demoData.js';

function freshState() {
  return { tasks: buildInitialTasks(), lanes: DEMO_LANES };
}

describe('runLkCommand', () => {
  it('prints the real banner for no input', () => {
    const outcome = runLkCommand('', freshState());
    expect(outcome.lines[0]).toBe('');
    expect(outcome.lines).toContain('Lanekeeper CLI (lk) - Developer Task & Flight Deck Companion');
    expect(outcome.effect).toBeUndefined();
  });

  it('prints the real banner for an unrecognized command', () => {
    const outcome = runLkCommand('lk --help', freshState());
    expect(outcome.lines).toContain('Lanekeeper CLI (lk) - Developer Task & Flight Deck Companion');
  });

  it('lists the seeded tasks with lane and estimate', () => {
    const outcome = runLkCommand('list', freshState());
    expect(outcome.lines[1]).toBe('Lanekeeper Flight Deck (Terminal View)');
    expect(outcome.lines.some((l) => l.includes('LK-1') && l.includes('[inprogress]'))).toBe(true);
    expect(outcome.lines.at(-2)).toBe('Run `lk start <KEY>` to begin work, or `lk close <KEY>` to finish.');
  });

  it('reports the empty state when there are no tasks', () => {
    const outcome = runLkCommand('list', { tasks: [], lanes: DEMO_LANES });
    expect(outcome.lines).toContain('  No tasks yet. Run `lk add "<text>"` to capture one.');
  });

  it('rejects add with no text', () => {
    const outcome = runLkCommand('add', freshState());
    expect(outcome.lines[0]).toBe('Error: Please provide task text.');
    expect(outcome.effect).toBeUndefined();
  });

  it('parses quick-capture syntax and lands the task in the first backlog lane', () => {
    const state = freshState();
    const outcome = runLkCommand('add Ship the docs site #web !urgent ^friday', state);
    expect(outcome.effect?.type).toBe('create');
    if (outcome.effect?.type !== 'create') throw new Error('expected create effect');
    expect(outcome.effect.task.title).toBe('Ship the docs site');
    expect(outcome.effect.task.tags).toEqual(['web']);
    expect(outcome.effect.task.priority).toBe('urgent');
    expect(outcome.effect.task.laneId).toBe('triage');
    expect(outcome.effect.task.key).toBe(`LK-${state.tasks.length + 1}`);
    expect(outcome.lines).toContain(`Ingested task: [${outcome.effect.task.key}] Ship the docs site`);
  });

  it('strips a surrounding quoted-string pair, since there is no real shell to do it', () => {
    const state = freshState();
    const outcome = runLkCommand('add "Ship the docs site #web !urgent ^friday"', state);
    expect(outcome.effect?.type).toBe('create');
    if (outcome.effect?.type !== 'create') throw new Error('expected create effect');
    expect(outcome.effect.task.title).toBe('Ship the docs site');
    expect(outcome.effect.task.dueDate).toBeDefined();
  });

  it('requires a key for start', () => {
    const outcome = runLkCommand('start', freshState());
    expect(outcome.lines).toEqual(['Error: Please provide task key (e.g. lk start LK-42)']);
  });

  it('reports a missing task on start', () => {
    const outcome = runLkCommand('start LK-999', freshState());
    expect(outcome.lines).toEqual(['Error: Task LK-999 not found']);
  });

  it('starts a task into the in-development lane and suggests a branch', () => {
    const outcome = runLkCommand('start lk-2', freshState());
    expect(outcome.effect).toEqual({ type: 'transition', taskId: 'LK-2', laneId: 'inprogress' });
    expect(outcome.lines).toContain('  git checkout -b feature/lk-2-task');
  });

  it('accepts the full shell-style invocation with the "lk" binary name, same as without it', () => {
    const withPrefix = runLkCommand('lk list', freshState());
    const withoutPrefix = runLkCommand('list', freshState());
    expect(withPrefix.lines).toEqual(withoutPrefix.lines);
  });

  it('treats a bare "lk" with no subcommand as the banner, same as no input', () => {
    const outcome = runLkCommand('lk', freshState());
    expect(outcome.lines).toContain('Lanekeeper CLI (lk) - Developer Task & Flight Deck Companion');
  });

  it('closes a task via close or the done alias', () => {
    const viaClose = runLkCommand('close LK-1', freshState());
    expect(viaClose.effect).toEqual({ type: 'transition', taskId: 'LK-1', laneId: 'done' });

    const viaDone = runLkCommand('done LK-1', freshState());
    expect(viaDone.effect).toEqual({ type: 'transition', taskId: 'LK-1', laneId: 'done' });
  });
});
