import React from 'react';
import { Search, X, Filter, Tag as TagIcon, RotateCcw } from 'lucide-react';
import type { TaskPriority } from '../../types/index.js';

interface BoardFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPriority: TaskPriority | 'all';
  onPriorityChange: (priority: TaskPriority | 'all') => void;
  selectedTag: string | 'all';
  onTagChange: (tag: string | 'all') => void;
  availableTags: string[];
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

const PRIORITIES: Array<{ id: TaskPriority | 'all'; label: string; activeClass: string }> = [
  { id: 'all', label: 'All', activeClass: 'bg-slate-700 text-white border-slate-600' },
  { id: 'urgent', label: 'Urgent', activeClass: 'bg-rose-950/80 text-rose-300 border-rose-600/80' },
  { id: 'high', label: 'High', activeClass: 'bg-amber-950/80 text-amber-300 border-amber-600/80' },
  { id: 'medium', label: 'Medium', activeClass: 'bg-blue-950/80 text-blue-300 border-blue-600/80' },
  { id: 'low', label: 'Low', activeClass: 'bg-slate-800 text-slate-300 border-slate-700' }
];

export const BoardFilterBar: React.FC<BoardFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedPriority,
  onPriorityChange,
  selectedTag,
  onTagChange,
  availableTags,
  totalCount,
  filteredCount,
  onResetFilters
}) => {
  const hasActiveFilters = searchQuery.trim() !== '' || selectedPriority !== 'all' || selectedTag !== 'all';

  return (
    <div className="mx-4 mt-3 mb-1 px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
      {/* Left: Search input & priority filter */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search input */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search board (key, title, #tag)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 placeholder-slate-500 pl-8 pr-7 py-1.5 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 font-sans text-xs transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              title="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Priority quick filters */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <Filter className="w-3 h-3 text-slate-500 ml-1 mr-0.5 shrink-0" />
          {PRIORITIES.map((p) => {
            const isActive = selectedPriority === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPriorityChange(p.id)}
                className={`px-2 py-0.5 rounded-md font-medium text-[11px] border transition-colors ${
                  isActive
                    ? p.activeClass
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Tag filter selector */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <TagIcon className="w-3 h-3 text-slate-500 shrink-0" />
            <select
              value={selectedTag}
              onChange={(e) => onTagChange(e.target.value)}
              className="bg-transparent text-slate-300 text-xs font-mono outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-300">
                All Tags ({availableTags.length})
              </option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag} className="bg-slate-900 text-slate-300">
                  #{tag}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Matches counter & clear action */}
      <div className="flex items-center gap-2 text-slate-400">
        <span className="font-mono text-[11px]">
          {hasActiveFilters ? (
            <>
              Showing <strong className="text-slate-200">{filteredCount}</strong> of {totalCount} tasks
            </>
          ) : (
            <>
              <strong className="text-slate-200">{totalCount}</strong> total tasks
            </>
          )}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded-md border border-indigo-800/60 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
