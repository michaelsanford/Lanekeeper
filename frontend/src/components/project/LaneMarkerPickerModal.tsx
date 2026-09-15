import React, { useState, useMemo } from 'react';
import { X, Search, RotateCcw } from 'lucide-react';
import {
  LaneMarker,
  LANE_MARKER_DEFINITIONS,
  LANE_MARKER_CATEGORIES,
  type MarkerDefinition
} from '../icons/LaneMarker.js';

interface LaneMarkerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIcon?: string;
  laneColor: string;
  laneName: string;
  onSelectIcon: (iconKey: string) => void;
}

export const LaneMarkerPickerModal: React.FC<LaneMarkerPickerModalProps> = ({
  isOpen,
  onClose,
  currentIcon = 'buoy',
  laneColor,
  laneName,
  onSelectIcon
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customGlyph, setCustomGlyph] = useState('');

  const allDefinitions = useMemo(() => Object.values(LANE_MARKER_DEFINITIONS), []);

  const filteredMarkers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allDefinitions.filter((marker: MarkerDefinition) => {
      if (selectedCategory !== 'all' && marker.category !== selectedCategory) {
        return false;
      }
      if (q) {
        return (
          marker.label.toLowerCase().includes(q) ||
          marker.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allDefinitions, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customGlyph.trim()) {
      onSelectIcon(customGlyph.trim());
      setCustomGlyph('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-800 bg-slate-900"
              style={{ color: laneColor }}
            >
              <LaneMarker icon={currentIcon} color={laneColor} size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Choose Swimlane Marker</h3>
              <p className="text-xs text-slate-400">
                Marker glyph for <strong className="text-slate-200">{laneName || 'Lane'}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Search and Categories */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/30">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search markers (e.g. check, eye, zap, bug, code)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 text-xs font-sans"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {LANE_MARKER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Marker Grid */}
        <div className="p-4 overflow-y-auto flex-1">
          {filteredMarkers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching markers found for "{searchQuery}".
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {filteredMarkers.map((marker) => {
                const isSelected = currentIcon === marker.id;
                return (
                  <button
                    key={marker.id}
                    type="button"
                    onClick={() => {
                      onSelectIcon(marker.id);
                      onClose();
                    }}
                    title={marker.label}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center gap-1 p-1 transition-all border ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/50 scale-105'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <LaneMarker icon={marker.id} color={laneColor} size={18} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Glyph & Reset Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          {/* Custom Glyph input */}
          <form onSubmit={handleApplyCustom} className="flex items-center gap-2 flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Custom glyph or symbol..."
              value={customGlyph}
              maxLength={4}
              onChange={(e) => setCustomGlyph(e.target.value)}
              className="bg-slate-900 text-slate-100 px-2.5 py-1 rounded-lg border border-slate-800 outline-none focus:border-indigo-500 text-xs flex-1 max-w-xs"
            />
            <button
              type="submit"
              disabled={!customGlyph.trim()}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Apply
            </button>
          </form>

          {/* Reset to Buoy Float */}
          <button
            type="button"
            onClick={() => {
              onSelectIcon('buoy');
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 text-xs transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Default Buoy</span>
          </button>
        </div>
      </div>
    </div>
  );
};
