import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TerminalSquare } from 'lucide-react';
import type { DemoWorkspace } from '../demo/useDemoWorkspace.js';

interface TerminalDemoProps {
  workspace: DemoWorkspace;
}

const SCRIPT = ['lk list', 'lk start LK-2', 'lk add "Ship the marketing site #web !high ^friday"'];

const TYPE_DELAY_MS = 28;
const OUTPUT_PAUSE_MS = 450;
const COMMAND_PAUSE_MS = 900;

/**
 * A terminal that first types out a scripted lk session, using the CLI's
 * exact plain-text output (cli/lk.mjs emits no ANSI color -- neither does
 * this), then hands over a live prompt running the same commands against
 * the same demo state the board above renders.
 */
export const TerminalDemo: React.FC<TerminalDemoProps> = ({ workspace }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [liveInput, setLiveInput] = useState('');
  const [replaying, setReplaying] = useState(true);
  const timeoutsRef = useRef<number[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // Always call the *latest* runCommand, not the one closed over when the
  // scripted-replay effect below first ran -- each step must see the demo
  // state left behind by the step before it (task counts, lane contents).
  const runCommandRef = useRef(workspace.runCommand);
  useEffect(() => {
    runCommandRef.current = workspace.runCommand;
  }, [workspace.runCommand]);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      const scripted: string[] = [];
      for (const command of SCRIPT) {
        scripted.push(`$ ${command}`, ...runCommandRef.current(command));
      }
      setLines(scripted);
      setReplaying(false);
      return;
    }

    let commandIndex = 0;

    const typeCommand = (command: string, charIndex: number) => {
      setLines((prev) => [...prev.slice(0, -1), `$ ${command.slice(0, charIndex)}`]);

      if (charIndex < command.length) {
        schedule(() => typeCommand(command, charIndex + 1), TYPE_DELAY_MS);
        return;
      }

      schedule(() => {
        const output = runCommandRef.current(command);
        setLines((prev) => [...prev, ...output]);
        schedule(runNextCommand, COMMAND_PAUSE_MS);
      }, OUTPUT_PAUSE_MS);
    };

    const runNextCommand = () => {
      if (commandIndex >= SCRIPT.length) {
        setReplaying(false);
        return;
      }
      const command = SCRIPT[commandIndex];
      commandIndex += 1;
      setLines((prev) => [...prev, '$ ']);
      typeCommand(command, 0);
    };

    schedule(runNextCommand, 500);

    return () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];
    };
    // Runs once per real mount (React's StrictMode dev double-invoke fully
    // tears down and re-runs this via the cleanup above, so no extra guard
    // is needed); runCommandRef keeps it reading the latest command handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const command = liveInput.trim();
    if (!command) return;
    const output = workspace.runCommand(command);
    setLines((prev) => [...prev, `$ ${command}`, ...output]);
    setLiveInput('');
  };

  return (
    <section id="terminal" className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mb-2">The lk CLI</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          The same four commands the real <code className="font-mono text-indigo-300">lk</code> binary ships with, run against the
          board above. Once the intro finishes, it&rsquo;s your terminal &mdash; try <code className="font-mono text-indigo-300">lk list</code>,{' '}
          <code className="font-mono text-indigo-300">lk close LK-1</code>, or <code className="font-mono text-indigo-300">lk help</code>.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900/80">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 flex items-center gap-1.5 text-xs font-mono text-slate-500">
            <TerminalSquare size={13} />
            lk &mdash; Lanekeeper CLI
          </span>
        </div>

        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-label="lk terminal session"
          className="h-80 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed text-slate-300"
        >
          {lines.map((line, i) => (
            <div
              key={i}
              className={line.startsWith('$ ') ? 'text-emerald-400' : line.startsWith('Error:') ? 'text-rose-400' : undefined}
            >
              {line === '' ? ' ' : line}
            </div>
          ))}
          {replaying ? <div aria-hidden="true" className="inline-block w-2 h-3.5 bg-slate-500 animate-pulse align-text-bottom" /> : null}
        </div>

        <form onSubmit={submitCommand} className="flex items-center gap-2 border-t border-slate-800 bg-slate-900/60 px-4 py-2.5">
          <span className="font-mono text-sm text-emerald-400 select-none">$</span>
          <label htmlFor="lk-terminal-input" className="sr-only">
            lk command
          </label>
          <input
            id="lk-terminal-input"
            type="text"
            value={liveInput}
            onChange={(e) => setLiveInput(e.target.value)}
            disabled={replaying}
            placeholder={replaying ? 'Running the intro...' : 'lk list'}
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 font-mono text-sm outline-none disabled:cursor-not-allowed"
          />
        </form>
      </div>
    </section>
  );
};
