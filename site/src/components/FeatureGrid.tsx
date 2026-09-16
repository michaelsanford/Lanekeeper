import React from 'react';
import { CloudOff, Fingerprint, ShieldCheck, Zap, Mic, Share2, GitBranch, LayoutGrid, Bell, Keyboard } from 'lucide-react';
import { FEATURE_DEFINITIONS } from '../../../frontend/src/features/index.js';

const FEATURES: { icon: React.ElementType; title: string; description: string }[] = [
  {
    icon: CloudOff,
    title: 'Local-first CRDT architecture',
    description:
      'Built on Yjs and y-indexeddb. Zero-latency local reads and writes, full offline functionality, and deterministic conflict-free convergence when you sync.'
  },
  {
    icon: Zap,
    title: 'Deterministic project prefixes & offline ID leasing',
    description:
      'Predictable issue numbers (LK-42) backed by atomic counters, with offline ID reservation leases so you can create tickets while disconnected without collisions.'
  },
  {
    icon: Fingerprint,
    title: 'Cognito with enforced TOTP MFA',
    description: 'Hardware and software token MFA with a QR-code onboarding flow.'
  },
  {
    icon: LayoutGrid,
    title: "Today's Flight Deck",
    description: 'Press F to collapse the board down to 1-3 active cards in flight, with overdue alerts and a local scratchpad.'
  },
  {
    icon: Bell,
    title: 'Native web push reminders',
    description: 'Standards-based VAPID push via service worker, with scheduled due-date reminders.'
  },
  {
    icon: Mic,
    title: 'On-device voice capture',
    description: 'Zero-cloud-cost speech-to-task dictation using the browser Web Speech API.'
  },
  {
    icon: Share2,
    title: 'PWA share target & shortcuts',
    description: 'Installable to a home screen with native share-sheet integration and long-press quick actions.'
  },
  {
    icon: GitBranch,
    title: 'GitHub smart commits',
    description: 'Pushing fix(auth): handle token expiry (fixes LK-42) transitions LK-42 to Done and logs the commit.'
  },
  {
    icon: ShieldCheck,
    title: 'Multiple operational views',
    description: 'Kanban board, sortable table, full-month calendar, and single-task Flight Deck focus mode.'
  }
];

/** Feature-flag copy pulled directly from FEATURE_DEFINITIONS (frontend/src/features/engine.ts). */
export const FeatureGrid: React.FC = () => (
  <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
    <div className="mb-8 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mb-2">What&rsquo;s in the box</h2>
      <p className="text-slate-400 max-w-xl mx-auto">
        ~12,700 lines across frontend, backend, and CLI. MIT licensed.
      </p>
    </div>

    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
      {FEATURES.map(({ icon: Icon, title, description }) => (
        <div key={title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="w-9 h-9 rounded-lg bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center mb-3">
            <Icon size={16} className="text-indigo-400" />
          </div>
          <div className="text-sm font-semibold text-slate-100 mb-1">{title}</div>
          <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
        </div>
      ))}
    </div>

    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Keyboard size={16} className="text-indigo-400" />
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Feature flags, off by default</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {Object.values(FEATURE_DEFINITIONS).map((def) => (
          <div key={def.id} className="text-sm">
            <div className="font-semibold text-slate-200 mb-1">{def.name}</div>
            <p className="text-xs text-slate-400 leading-relaxed">{def.description}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] font-mono text-slate-500 mt-4">
        Flip one for this session with a URL flag, e.g. <code className="text-indigo-400">?ff_timeTracking=on</code>
      </p>
    </div>
  </section>
);
