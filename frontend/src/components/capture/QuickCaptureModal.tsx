import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Mic,
  MicOff,
  Tag,
  Calendar,
  Clock,
  User,
  AlertCircle,
  X,
  CornerDownLeft
} from 'lucide-react';
import { parseQuickTask } from '../../utils/parser.js';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition.js';
import { ModalShell } from '../common/ModalShell.js';
import type { TaskPriority } from '../../types/index.js';

async function celebrate(): Promise<void> {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  try {
    // Loaded on demand — a full task is created far less often than this
    // modal is opened, and canvas-confetti has no business in the main bundle.
    const { default: confetti } = await import('canvas-confetti');
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
  } catch {}
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
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onSubmitTask
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { isListening, isSupported: isSpeechSupported, startListening, stopListening } =
    useSpeechRecognition();

  useEffect(() => {
    if (!isOpen) {
      setInput('');
      if (isListening) stopListening();
    }
  }, [isOpen]);

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

  const appendChip = (text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
    inputRef.current?.focus();
  };

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
              onChange={(e) => setInput(e.target.value)}
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
              <span className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-800/60 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                !{parsed.priority}
              </span>
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
                  day: 'numeric'
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

          {/* Quick Syntax Insertion Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-400 uppercase font-mono mr-1">Insert:</span>
            <button
              type="button"
              onClick={() => appendChip('#backend')}
              className="text-xs font-mono text-slate-300 hover:text-indigo-300 bg-slate-800/60 hover:bg-indigo-950/50 px-2.5 py-1 rounded-md border border-slate-700/60 transition-colors"
            >
              #tag
            </button>
            <button
              type="button"
              onClick={() => appendChip('!urgent')}
              className="text-xs font-mono text-slate-300 hover:text-rose-300 bg-slate-800/60 hover:bg-rose-950/50 px-2.5 py-1 rounded-md border border-slate-700/60 transition-colors"
            >
              !urgent
            </button>
            <button
              type="button"
              onClick={() => appendChip('^tomorrow')}
              className="text-xs font-mono text-slate-300 hover:text-cyan-300 bg-slate-800/60 hover:bg-cyan-950/50 px-2.5 py-1 rounded-md border border-slate-700/60 transition-colors"
            >
              ^tomorrow
            </button>
            <button
              type="button"
              onClick={() => appendChip('~1h')}
              className="text-xs font-mono text-slate-300 hover:text-amber-300 bg-slate-800/60 hover:bg-amber-950/50 px-2.5 py-1 rounded-md border border-slate-700/60 transition-colors"
            >
              ~1h
            </button>
          </div>

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
                className="text-slate-400 hover:text-slate-200 px-3.5 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!parsed.title.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-all text-sm"
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
