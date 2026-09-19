import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Zap,
  Mic,
  MicOff,
  Tag,
  Calendar,
  Clock,
  User,
  AlertOctagon,
  X,
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { parseQuickTask, parseDateToken } from '../../utils/parser.js';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition.js';
import { ModalShell } from '../common/ModalShell.js';
import type { TaskPriority } from '../../types/index.js';
import { PriorityBadge } from '../common/PriorityBadge.js';
import { PRIORITY_CONFIG } from '../../utils/priorities.js';

async function celebrate(): Promise<void> {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  try {
    const { default: confetti } = await import('canvas-confetti');
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
  } catch {}
}

export function applySuggestion(
  currentText: string,
  caretPos: number | null,
  suggestion: string
): { newText: string; newCaretPos: number } {
  const pos = caretPos !== null && caretPos !== undefined ? caretPos : currentText.length;
  const beforeCaret = currentText.slice(0, pos);
  const afterCaret = currentText.slice(pos);

  const isTriggerOnly = suggestion.length === 1 && '^!~#@'.includes(suggestion);
  const trailing = isTriggerOnly ? '' : afterCaret.startsWith(' ') ? '' : ' ';

  const tokenMatch = beforeCaret.match(/(?:^|\s)([\^!~#@][^\s]*)$/);
  let newBefore = '';
  if (tokenMatch) {
    const matchedToken = tokenMatch[1];
    const matchStart = beforeCaret.lastIndexOf(matchedToken);
    const prefix = beforeCaret.slice(0, matchStart);
    newBefore = `${prefix}${suggestion}${trailing}`;
  } else {
    const needsLeadingSpace = beforeCaret.length > 0 && !beforeCaret.endsWith(' ');
    newBefore = `${beforeCaret}${needsLeadingSpace ? ' ' : ''}${suggestion}${trailing}`;
  }

  const newText = `${newBefore}${afterCaret}`;
  const newCaretPos = isTriggerOnly
    ? newBefore.length
    : afterCaret.startsWith(' ')
    ? newBefore.length + 1
    : newBefore.length;

  return { newText, newCaretPos };
}

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTask: (task: {
    title: string;
    tags: string[];
    priority: TaskPriority;
    dueDate?: string;
    assigneeId?: string;
    estimateMinutes?: number;
  }) => void;
  availableTags?: string[];
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onSubmitTask,
  availableTags = []
}) => {
  const [input, setInput] = useState('');
  const [caretPos, setCaretPos] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isListening, isSupported: isSpeechSupported, startListening, stopListening } =
    useSpeechRecognition();

  useEffect(() => {
    if (!isOpen) {
      setInput('');
      setCaretPos(null);
      setShowGuide(false);
      if (isListening) stopListening();
    }
  }, [isOpen]);

  const activeTrigger = useMemo(() => {
    const pos = caretPos !== null ? caretPos : input.length;
    const beforeCaret = input.slice(0, pos);
    const match = beforeCaret.match(/(?:^|\s)([\^!~#@])([^\s]*)$/);
    if (!match) return null;
    return { trigger: match[1], query: match[2].toLowerCase() };
  }, [input, caretPos]);

  const triggerSuggestions = useMemo(() => {
    if (!activeTrigger) return [];
    const { trigger, query } = activeTrigger;

    if (trigger === '^') {
      const candidates: Array<{ value: string; label: string }> = [
        { value: '^today', label: 'Today' },
        { value: '^tomorrow', label: 'Tomorrow' },
        { value: '^fri', label: 'Friday' },
        { value: '^mon', label: 'Monday' },
        { value: '^2026-11-04', label: 'Nov 4 (ISO)' },
        { value: '^apr-04', label: 'Apr 4 (Month-Day)' }
      ];

      const now = new Date();
      const currentYear = now.getFullYear();
      const nextMonthDate = new Date(currentYear, now.getMonth() + 1, 1);
      const nextMonthName = nextMonthDate.toLocaleString('en-US', { month: 'short' }).toLowerCase();
      const nextMonthValue = `^${nextMonthName}-01`;
      if (!candidates.some((c) => c.value === nextMonthValue)) {
        candidates.push({ value: nextMonthValue, label: `${nextMonthName.toUpperCase()} 1` });
      }

      const filtered = candidates.filter(
        (c) =>
          !query ||
          c.value.toLowerCase().includes(query) ||
          c.label.toLowerCase().includes(query)
      );

      // If user typed a custom date query that parses, dynamically offer it
      if (query.length >= 3 && !filtered.some((f) => f.value.toLowerCase() === `^${query}`)) {
        const parsedQuery = parseDateToken(query, now);
        if (parsedQuery) {
          filtered.unshift({
            value: `^${query}`,
            label: parsedQuery.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: parsedQuery.getFullYear() !== currentYear ? 'numeric' : undefined
            })
          });
        }
      }

      return filtered;
    }

    if (trigger === '!') {
      const candidates: Array<{ value: string; label: string; priority: TaskPriority }> = [
        { value: '!urgent', label: 'Urgent', priority: 'urgent' },
        { value: '!high', label: 'High', priority: 'high' },
        { value: '!medium', label: 'Medium', priority: 'medium' },
        { value: '!low', label: 'Low', priority: 'low' }
      ];
      return candidates.filter((c) => {
        const q = query.toLowerCase();
        return (
          !q ||
          c.value.toLowerCase().slice(1).startsWith(q) ||
          c.value.toLowerCase().includes(q) ||
          c.label.toLowerCase().includes(q)
        );
      });
    }

    if (trigger === '~') {
      const candidates = [
        { value: '~15m', label: '15m' },
        { value: '~30m', label: '30m' },
        { value: '~1h', label: '1 hour' },
        { value: '~2h', label: '2 hours' },
        { value: '~4h', label: '4 hours' },
        { value: '~1d', label: '1 day' }
      ];
      return candidates.filter(
        (c) => !query || c.value.toLowerCase().includes(query) || c.label.toLowerCase().includes(query)
      );
    }

    if (trigger === '#') {
      const defaults = ['backend', 'frontend', 'bug', 'feature', 'chore', 'docs', 'ui', 'api'];
      const combined = Array.from(new Set([...availableTags, ...defaults]));
      return combined
        .filter((t) => !query || t.toLowerCase().includes(query))
        .slice(0, 6)
        .map((t) => ({ value: `#${t}`, label: `#${t}` }));
    }

    if (trigger === '@') {
      return [{ value: '@me', label: 'Assign to me' }];
    }

    return [];
  }, [activeTrigger, availableTags]);

  if (!isOpen) return null;

  const parsed = parseQuickTask(input);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed.title.trim()) return;

    onSubmitTask({
      title: parsed.title,
      tags: parsed.tags,
      priority: parsed.priority,
      dueDate: parsed.dueDate,
      assigneeId: parsed.assignee,
      estimateMinutes: parsed.estimateMinutes
    });

    void celebrate();

    setInput('');
    setCaretPos(null);
    onClose();
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      });
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    const { newText, newCaretPos } = applySuggestion(input, caretPos, suggestion);
    setInput(newText);
    setCaretPos(newCaretPos);
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCaretPos, newCaretPos);
      }
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      if (activeTrigger && triggerSuggestions.length === 1) {
        e.preventDefault();
        e.stopPropagation();
        handleSelectSuggestion(triggerSuggestions[0].value);
      }
    }
  };

  const isSingleSuggestion = activeTrigger !== null && triggerSuggestions.length === 1;

  return (
    <ModalShell
      onClose={onClose}
      labelledBy="quick-capture-title"
      initialFocusRef={inputRef}
      backdropClassName="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
      panelClassName="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Modal Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between text-sm text-slate-300">
        <div className="flex items-center gap-2.5 font-semibold text-slate-100" id="quick-capture-title">
          <Zap className="w-5 h-5 text-indigo-400 fill-current" />
          <span>Quick Task Ingestion</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setCaretPos(e.target.selectionStart);
            }}
            onKeyDown={handleInputKeyDown}
            onKeyUp={(e) => setCaretPos(e.currentTarget.selectionStart)}
            onClick={(e) => setCaretPos(e.currentTarget.selectionStart)}
            placeholder="e.g. Upgrade Cognito auth middleware #backend !urgent ^tomorrow ~2h"
            className="w-full bg-slate-950 text-slate-100 text-base px-4 py-3.5 pr-12 rounded-xl border border-slate-700/80 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
          />

          {/* Microphone button for Voice-to-Task */}
          {isSpeechSupported && (
            <button
              type="button"
              onClick={handleVoiceToggle}
              title={isListening ? 'Stop recording voice' : 'Speak task'}
              className={`absolute right-3 p-2 rounded-lg transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Real-time Parsed Metadata Tokens Preview */}
        <div className="min-h-[2.75rem] p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-400 text-xs font-mono select-none">Preview:</span>

          {parsed.title ? (
            <span className="text-slate-100 font-medium">{parsed.title}</span>
          ) : (
            <span className="text-slate-500 italic text-sm">Type a task title...</span>
          )}

          {parsed.priority !== 'none' && (
            <PriorityBadge priority={parsed.priority} size="sm" />
          )}

          {parsed.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-0.5 rounded bg-indigo-950/50 text-indigo-300 border border-indigo-800/60 font-medium"
            >
              <Tag className="w-3.5 h-3.5" />
              #{tag}
            </span>
          ))}

          {parsed.dueDate && (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-800/60 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(parsed.dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          )}

          {parsed.estimateMinutes && (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/60 font-medium">
              <Clock className="w-3.5 h-3.5" />
              ~{parsed.estimateMinutes}m
            </span>
          )}

          {parsed.assignee && (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 font-medium">
              <User className="w-3.5 h-3.5" />
              @{parsed.assignee}
            </span>
          )}
        </div>

        {/* Dynamic Contextual Suggestions Strip (when typing active token) */}
        {activeTrigger && (
          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-indigo-900/40 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Suggestions for</span>
              <span className="text-indigo-300 font-bold">{activeTrigger.trigger}</span>
              {activeTrigger.trigger === '^' && <span className="text-slate-500">(due date)</span>}
              {activeTrigger.trigger === '!' && <span className="text-slate-500">(priority)</span>}
              {activeTrigger.trigger === '~' && <span className="text-slate-500">(estimate)</span>}
              {activeTrigger.trigger === '#' && <span className="text-slate-500">(tag)</span>}
              {activeTrigger.trigger === '@' && <span className="text-slate-500">(assignee)</span>}
              <span>:</span>
            </span>

            {triggerSuggestions.map((sug) => {
              if (activeTrigger.trigger === '!' && 'priority' in sug) {
                const pConfig = PRIORITY_CONFIG[sug.priority as TaskPriority];
                const Icon = pConfig.icon;
                return (
                  <button
                    key={sug.value}
                    type="button"
                    onClick={() => handleSelectSuggestion(sug.value)}
                    className={`inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer hover:brightness-110 ${pConfig.badgeClass}`}
                    title={`Insert ${sug.value}`}
                  >
                    <Icon size={12} className="shrink-0" aria-hidden={true} />
                    <span>{sug.value}</span>
                    <span className="text-[10px] opacity-75 font-sans">({sug.label})</span>
                    {isSingleSuggestion && (
                      <kbd className="text-[10px] font-mono bg-slate-900/90 text-slate-300 px-1 py-0.2 rounded border border-slate-700/80 ml-0.5">
                        Tab
                      </kbd>
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={sug.value}
                  type="button"
                  onClick={() => handleSelectSuggestion(sug.value)}
                  className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800/80 text-slate-200 hover:text-white hover:bg-slate-700/80 hover:border-slate-600 transition-all cursor-pointer"
                  title={`Insert ${sug.value}`}
                >
                  <span>{sug.value}</span>
                  {sug.label && sug.label !== sug.value && (
                    <span className="text-[10px] text-slate-400 font-sans">({sug.label})</span>
                  )}
                  {isSingleSuggestion && (
                    <kbd className="text-[10px] font-mono bg-slate-900/90 text-slate-300 px-1 py-0.2 rounded border border-slate-700/80 ml-0.5">
                      Tab
                    </kbd>
                  )}
                </button>
              );
            })}

            {triggerSuggestions.length === 0 && (
              <span className="text-slate-500 text-xs italic">
                {activeTrigger.trigger === '^'
                  ? 'Type a date e.g. ^apr-04, ^2026-11-04, or ^tomorrow'
                  : `No matching ${activeTrigger.trigger} suggestions`}
              </span>
            )}

            {isSingleSuggestion && (
              <span className="text-slate-400 text-[11px] font-sans ml-1">
                (Press <kbd className="text-[10px] font-mono bg-slate-900 text-slate-300 px-1 py-0.2 rounded border border-slate-700">Tab</kbd> to select)
              </span>
            )}
          </div>
        )}

        {/* Quick Syntax Insertion Chips & Syntax Guide Toggle (when idle) */}
        {!activeTrigger && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 uppercase font-mono text-[11px] mr-1">Insert:</span>
              <button
                type="button"
                onClick={() => handleSelectSuggestion('^')}
                className="inline-flex items-center gap-1 font-mono text-xs text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 px-2 py-0.5 rounded-md border border-cyan-800/60 transition-colors cursor-pointer"
                title="Due date macros (^today, ^tomorrow, ^fri, ^apr-04, etc.)"
              >
                <Calendar className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>^ due</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectSuggestion('!')}
                className="inline-flex items-center gap-1 font-mono text-xs text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 px-2 py-0.5 rounded-md border border-rose-800/60 transition-colors cursor-pointer"
                title="Priority macros (!urgent, !high, !med, !low)"
              >
                <AlertOctagon className="w-3 h-3 text-rose-400 shrink-0" />
                <span>! priority</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectSuggestion('~')}
                className="inline-flex items-center gap-1 font-mono text-xs text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 px-2 py-0.5 rounded-md border border-amber-800/60 transition-colors cursor-pointer"
                title="Estimate macros (~15m, ~30m, ~1h, ~2h)"
              >
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                <span>~ estimate</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectSuggestion('#')}
                className="inline-flex items-center gap-1 font-mono text-xs text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 px-2 py-0.5 rounded-md border border-indigo-800/60 transition-colors cursor-pointer"
                title="Tag (#tag)"
              >
                <Tag className="w-3 h-3 text-indigo-400 shrink-0" />
                <span># tag</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectSuggestion('@')}
                className="inline-flex items-center gap-1 font-mono text-xs text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-800/60 transition-colors cursor-pointer"
                title="Assignee (@user)"
              >
                <User className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>@ user</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Toggle quick syntax guide"
            >
              <HelpCircle className="w-3 h-3 text-slate-400" />
              <span>Syntax Guide</span>
              {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        )}

        {/* Collapsible Syntax Guide */}
        {showGuide && (
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-slate-200 text-[11px] font-mono uppercase tracking-wider">
              Quick Capture Syntax & Macros Cheatsheet
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-cyan-400">^</span>
                  <span className="text-slate-400">Due:</span>
                  <span className="font-mono text-slate-300">^today, ^tomorrow, ^fri, ^2026-11-04, ^apr-04</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-rose-400">!</span>
                  <span className="text-slate-400">Priority:</span>
                  <span className="font-mono text-slate-300">!urgent, !high, !med, !low</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-amber-400">~</span>
                  <span className="text-slate-400">Estimate:</span>
                  <span className="font-mono text-slate-300">~15m, ~30m, ~1h, ~2h, ~1d</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-indigo-400">#</span>
                  <span className="text-slate-400">Tag:</span>
                  <span className="font-mono text-slate-300">#backend, #frontend, #bug...</span>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80">
              Tip: Press <kbd className="bg-slate-900 px-1 py-0.2 rounded text-slate-300 border border-slate-700">Tab</kbd> while typing to autocomplete any single filtered suggestion (e.g. !ur &rarr; !urgent).
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-sm">
          <span className="text-slate-400 font-mono text-xs">
            Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">Enter</kbd> to
            create
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 px-3.5 py-2 text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!parsed.title.trim()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-all text-sm cursor-pointer"
            >
              <span>Create Task</span>
              <CornerDownLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
};
