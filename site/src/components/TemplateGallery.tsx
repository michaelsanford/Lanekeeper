import React from 'react';
import { WORKFLOW_TEMPLATES } from '../../../frontend/src/utils/templates.js';

/** The product's own 7 workflow templates (frontend/src/utils/templates.ts), lanes and WIP limits included. */
export const TemplateGallery: React.FC = () => (
  <section id="templates" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
    <div className="mb-6 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mb-2">Seven workflow templates</h2>
      <p className="text-slate-400 max-w-xl mx-auto">
        Every project starts from one of these &mdash; each lane carries a color, a type the app keys behavior off
        of, and an optional WIP limit.
      </p>
    </div>

    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {WORKFLOW_TEMPLATES.map((tpl) => (
        <div key={tpl.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
          <div className="text-base font-bold text-slate-100 tracking-tight mb-1">{tpl.name}</div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed flex-1">{tpl.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {tpl.lanes.map((lane) => (
              <span
                key={lane.id}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-300 bg-slate-950/60 px-2 py-1 rounded border border-slate-800"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: lane.color }} />
                {lane.name}
                {lane.wipLimit ? <span className="text-slate-500">&middot;{lane.wipLimit}</span> : null}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </section>
);
