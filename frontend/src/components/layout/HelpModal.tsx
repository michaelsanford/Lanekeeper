import React, { useState } from 'react';
import { X, Zap, Terminal, Code, Copy, Check, RotateCw, Key } from 'lucide-react';
import { LanekeeperLogo } from '../icons/LaneIcons.js';
import { ModalShell } from '../common/ModalShell.js';
import type { UserProfile } from '../../types/index.js';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile;
  onGenerateCliToken?: () => string;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  profile,
  onGenerateCliToken
}) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<'pwsh' | 'bash' | null>(null);

  if (!isOpen) return null;

  const cliToken = profile?.cliToken || 'lk_dev_seed_token';

  const handleCopyToken = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(cliToken);
      }
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleCopySnippet = async (type: 'pwsh' | 'bash') => {
    const text =
      type === 'pwsh'
        ? `$env:LANEKEEPER_API_TOKEN = "${cliToken}"`
        : `export LANEKEEPER_API_TOKEN="${cliToken}"`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedSnippet(type);
      setTimeout(() => setCopiedSnippet(null), 2000);
    } catch {
      setCopiedSnippet(type);
      setTimeout(() => setCopiedSnippet(null), 2000);
    }
  };

  return (
    <ModalShell
      onClose={onClose}
      labelledBy="help-modal-title"
      panelClassName="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-100" id="help-modal-title">
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

          {/* `lk` cli */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-wider text-slate-300 text-xs flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>`lk` cli</span>
              </h3>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                cli/lk.mjs
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Capture tasks, start feature branches, and monitor your flight deck directly from your terminal.
            </p>

            {/* Personal Access Token (PAT) Manager */}
            <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Personal Access Token (PAT)</span>
                </span>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                  4 Scopes Active (Locked)
                </span>
              </div>

              {/* Token string display and copy / regenerate actions */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs text-indigo-300 flex items-center justify-between overflow-hidden">
                  <span className="truncate select-all">{cliToken}</span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Token</span>
                    </>
                  )}
                </button>

                {onGenerateCliToken && (
                  <button
                    type="button"
                    onClick={onGenerateCliToken}
                    title="Generate a fresh Personal Access Token"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Setup & Shell Environment Authentication */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Setup &amp; Shell Authentication</span>
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="p-2 bg-slate-900/80 rounded border border-slate-800 text-slate-300 flex items-center justify-between">
                    <code>npm link</code>
                    <span className="text-[10px] text-slate-500 font-sans">Install `lk` globally</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopySnippet('pwsh')}
                    className="w-full text-left p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-slate-500 uppercase font-sans shrink-0">PowerShell:</span>
                      <code className="text-slate-300 truncate">
                        $env:LANEKEEPER_API_TOKEN = "{cliToken.slice(0, 10)}..."
                      </code>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-medium group-hover:underline shrink-0 ml-2">
                      {copiedSnippet === 'pwsh' ? 'Copied!' : 'Copy'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopySnippet('bash')}
                    className="w-full text-left p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-slate-500 uppercase font-sans shrink-0">Bash/Zsh:</span>
                      <code className="text-slate-300 truncate">
                        export LANEKEEPER_API_TOKEN="{cliToken.slice(0, 10)}..."
                      </code>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-medium group-hover:underline shrink-0 ml-2">
                      {copiedSnippet === 'bash' ? 'Copied!' : 'Copy'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Token Scopes Checklist */}
              <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">Token Scopes</span>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                    All Scopes Active (Locked)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/50 border border-slate-800/60 opacity-80 cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled={true}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-mono text-indigo-300 font-semibold text-[11px]">tasks:read</span>
                      <p className="text-[10px] text-slate-400">Read boards, lanes, and cards</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/50 border border-slate-800/60 opacity-80 cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled={true}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-mono text-indigo-300 font-semibold text-[11px]">tasks:write</span>
                      <p className="text-[10px] text-slate-400">Create, transition, and close tasks</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/50 border border-slate-800/60 opacity-80 cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled={true}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-mono text-indigo-300 font-semibold text-[11px]">sync:rw</span>
                      <p className="text-[10px] text-slate-400">CRDT delta synchronization</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/50 border border-slate-800/60 opacity-80 cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled={true}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-mono text-indigo-300 font-semibold text-[11px]">leases:issue</span>
                      <p className="text-[10px] text-slate-400">Focus lease reservations</p>
                    </div>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  Select All is permanently enabled to remind you to configure granular scope restrictions in an upcoming update.
                </p>
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
    </ModalShell>
  );
};
