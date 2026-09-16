import React from 'react';
import { LanekeeperLogo } from '../../../frontend/src/components/icons/LaneIcons.js';

export const SiteFooter: React.FC = () => (
  <footer className="border-t border-slate-800 bg-slate-950">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
      <div className="flex items-center gap-2">
        <LanekeeperLogo size={16} className="text-slate-600" />
        <span>Lanekeeper &mdash; MIT licensed</span>
      </div>
      <a
        href="https://github.com/michaelsanford/Lanekeeper"
        target="_blank"
        rel="noreferrer noopener"
        className="hover:text-slate-300 transition-colors"
      >
        github.com/michaelsanford/Lanekeeper
      </a>
    </div>
  </footer>
);
