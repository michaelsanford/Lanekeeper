import React from 'react';
import { X, Command, Zap } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
            <Command className="w-4 h-4 text-indigo-400" />
            <span>Lanekeeper Quick Reference</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-sm">
          {/* Keyboard Shortcuts */}
          <div className="space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-slate-300 text-xs">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Quick Capture</span>
                <kbd className="bg-slate-800 text-indigo-300 font-mono px-2 py-0.5 rounded border border-slate-700 text-xs">
                  C / Cmd+K
                </kbd>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Flight Deck Focus</span>
                <kbd className="bg-slate-800 text-indigo-300 font-mono px-2 py-0.5 rounded border border-slate-700 text-xs">
                  F
                </kbd>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Close Drawer/Modal</span>
                <kbd className="bg-slate-800 text-indigo-300 font-mono px-2 py-0.5 rounded border border-slate-700 text-xs">
                  Esc
                </kbd>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Show Shortcuts</span>
                <kbd className="bg-slate-800 text-indigo-300 font-mono px-2 py-0.5 rounded border border-slate-700 text-xs">
                  ?
                </kbd>
              </div>
            </div>
          </div>

          {/* Quick Syntax Guide */}
          <div className="space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-slate-300 text-xs flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>Quick Ingestion Syntax</span>
            </h3>
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5 font-mono text-xs">
              <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                <span className="text-indigo-400 font-semibold">#tag</span>
                <span className="text-slate-400 font-sans text-xs">Categorize with tags (e.g. #backend, #infra)</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                <span className="text-rose-400 font-semibold">!priority</span>
                <span className="text-slate-400 font-sans text-xs">!urgent, !high, !med, !low</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                <span className="text-cyan-400 font-semibold">^due</span>
                <span className="text-slate-400 font-sans text-xs">^today, ^tomorrow, ^fri, ^2026-10-31</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                <span className="text-amber-400 font-semibold">~estimate</span>
                <span className="text-slate-400 font-sans text-xs">~30m, ~2h, ~1.5h</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-emerald-400 font-semibold">@assignee</span>
                <span className="text-slate-400 font-sans text-xs">Assign task to team member</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
