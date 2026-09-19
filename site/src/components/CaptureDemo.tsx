import React, { useMemo, useState } from 'react';
import { Tag, CalendarClock, Timer, AtSign } from 'lucide-react';
import { parseQuickTask } from '../../../frontend/src/utils/parser.js';
import { PriorityBadge } from '../../../frontend/src/components/common/PriorityBadge.js';

const DEFAULT_INPUT = 'Upgrade Cognito auth pool #backend #infra !urgent ^tomorrow ~2h @michael';

const EXAMPLES = [
  'Upgrade Cognito auth pool #backend #infra !urgent ^tomorrow ~2h @michael',
  'File tax documentation #accounting ^apr-04',
  'Annual compliance audit ^2026-11-04 !high',
  'Fix the #auth login bug !high before ^friday the release ~45m',
  'Migrate table schema ~3pt !med',
  'Deploy !yesterday ~7q'
];

/**
 * A live run of the product's own quick-capture grammar (frontend/src/utils/parser.ts),
 * re-parsed on every keystroke. Nothing here is a mockup of the syntax -- it is the syntax.
 */
export const CaptureDemo: React.FC = () => {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const parsed = useMemo(() => parseQuickTask(input), [input]);

  return (
    <section id="capture" className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mb-2">Quick capture, for real</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Type <code className="font-mono text-indigo-300">#tag</code>, <code className="font-mono text-indigo-300">!priority</code>,{' '}
          <code className="font-mono text-indigo-300">^due</code>, <code className="font-mono text-indigo-300">~estimate</code>, and{' '}
          <code className="font-mono text-indigo-300">@assignee</code> tokens anywhere in the sentence &mdash; order doesn&rsquo;t matter,
          and anything that doesn&rsquo;t parse stays in the title.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          aria-label="Quick capture input"
          className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 px-4 py-3 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 font-mono text-sm transition-colors"
        />

        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setInput(example)}
              className="text-[11px] font-mono text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-800 px-2 py-1 rounded-md border border-slate-800 transition-colors cursor-pointer"
            >
              {example}
            </button>
          ))}
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2">Parsed title</div>
            <div className="text-base font-semibold text-slate-100">{parsed.title || 'Untitled Task'}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex flex-wrap items-center gap-2">
            {parsed.priority !== 'none' ? (
              <PriorityBadge priority={parsed.priority} size="sm" />
            ) : null}
            {parsed.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800"
              >
                <Tag size={12} className="text-slate-400" />
                {tag}
              </span>
            ))}
            {parsed.dueDate ? (
              <span className="inline-flex items-center gap-1 text-xs text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
                <CalendarClock size={12} />
                {new Date(parsed.dueDate).toLocaleDateString()}
              </span>
            ) : null}
            {parsed.estimateMinutes ? (
              <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                <Timer size={12} className="text-slate-400" />
                {parsed.estimateMinutes}m
              </span>
            ) : null}
            {parsed.assignee ? (
              <span className="inline-flex items-center gap-1 text-xs text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                <AtSign size={12} />
                {parsed.assignee}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
