import React from 'react';
import { LanekeeperLogo } from '../../../frontend/src/components/icons/LaneIcons.js';

/** A decorative pair of lane ropes with drifting buoys, echoing favicon.svg. Purely ambient. */
const LaneRopeBackdrop: React.FC = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 400 300"
    className="absolute inset-0 w-full h-full opacity-20"
    preserveAspectRatio="xMidYMid slice"
  >
    <line x1="60" y1="-20" x2="60" y2="320" stroke="#38bdf8" strokeWidth="2" opacity="0.5" />
    <line x1="340" y1="-20" x2="340" y2="320" stroke="#818cf8" strokeWidth="2" opacity="0.5" />
    {[20, 90, 160, 230].map((y, i) => (
      <rect key={`l-${y}`} x="52" y={y} width="16" height="12" rx="6" fill="#38bdf8" className="lk-rope-buoy" style={{ animationDelay: `${i * 0.6}s` }} />
    ))}
    {[50, 120, 190, 260].map((y, i) => (
      <rect key={`r-${y}`} x="332" y={y} width="16" height="12" rx="6" fill="#818cf8" className="lk-rope-buoy" style={{ animationDelay: `${i * 0.5 + 0.3}s` }} />
    ))}
  </svg>
);

interface HeroProps {
  taskCount: number;
}

export const Hero: React.FC<HeroProps> = ({ taskCount }) => (
  <section id="top" className="relative overflow-hidden border-b border-slate-800 bg-slate-950">
    <LaneRopeBackdrop />
    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-md shadow-indigo-500/20 mb-6">
        <LanekeeperLogo size={34} className="text-white" />
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-100 mb-5">
        Keep every task in its lane.
      </h1>
      <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-3">
        A fast, local-first task and project management PWA for solo developers and small
        engineering teams.
      </p>
      <p className="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed mb-9">
        The sweet spot between Todoist <span className="text-slate-500">(instant, frictionless capture, low latency)</span> and
        Jira <span className="text-slate-500">(project keys, kanban workflow lanes, structured metadata, estimation, git automation)</span>.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href="#board"
          className="h-11 flex items-center px-5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold rounded-lg shadow-sm shadow-indigo-600/30 transition-all active:scale-95"
        >
          Try the live board
        </a>
        <a
          href="#terminal"
          className="h-11 flex items-center px-5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition-colors"
        >
          Try the lk CLI
        </a>
      </div>
      <p className="mt-8 text-xs font-mono uppercase tracking-wider text-slate-500">
        Everything below is the real product &mdash; {taskCount} tasks, zero backend, running in your browser
      </p>
    </div>
  </section>
);
