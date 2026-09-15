import React from 'react';
import { X, Zap, Terminal, Code } from 'lucide-react';
import { LanekeeperLogo } from '../icons/LaneIcons.js';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
            <LanekeeperLogo size={18} className="text-indigo-400" />
            <span>Lanekeeper Quick Reference</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 text-sm overflow-y-auto flex-1">
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

          {/* Developer CLI Companion (lk) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-wider text-slate-300 text-xs flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Developer CLI Companion (lk)</span>
              </h3>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                cli/lk.mjs
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Capture tasks, start feature branches, and monitor your flight deck directly from your terminal.
            </p>

            {/* Quick Setup Commands */}
            <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                <span>Setup &amp; Authentication</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800 text-slate-300 flex items-center justify-between">
                  <code>npm link</code>
                  <span className="text-[10px] text-slate-500 font-sans">Install `lk` globally</span>
                </div>
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800 text-slate-300 flex items-center justify-between">
                  <code>$env:LANEKEEPER_API_TOKEN = "&lt;token&gt;"</code>
                  <span className="text-[10px] text-slate-500 font-sans">PowerShell token</span>
                </div>
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800 text-slate-300 flex items-center justify-between">
                  <code>export LANEKEEPER_API_TOKEN="&lt;token&gt;"</code>
                  <span className="text-[10px] text-slate-500 font-sans">Bash/Zsh token</span>
                </div>
              </div>
            </div>

            {/* CLI Command Reference Table */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5 font-mono text-xs">
              <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                <span className="text-indigo-400 font-semibold">lk add "&lt;text&gt;"</span>
                <span className="text-slate-400 font-sans text-xs">Quick ingest with full token syntax</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                <span className="text-indigo-400 font-semibold">lk list</span>
                <span className="text-slate-400 font-sans text-xs">List active flight deck and in-progress tasks</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                <span className="text-indigo-400 font-semibold">lk start &lt;KEY&gt;</span>
                <span className="text-slate-400 font-sans text-xs">Move to In Progress and output git branch command</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-indigo-400 font-semibold">lk close &lt;KEY&gt;</span>
                <span className="text-slate-400 font-sans text-xs">Complete and mark task as Done</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
