import React from 'react';
import { Check } from 'lucide-react';
import { getThemePreview, type ThemeId } from '../../../frontend/src/utils/themes.js';
import { useTheme } from '../../../frontend/src/hooks/useTheme.js';

interface ThemeGalleryProps {
  theme: ReturnType<typeof useTheme>;
}

/**
 * All 13 themes from the product's own registry (frontend/src/utils/themes.ts).
 * Clicking one calls the real applyTheme() -- it re-skins this entire page,
 * board included, because the site's own chrome resolves through the same
 * --lk-* tokens the product uses.
 */
export const ThemeGallery: React.FC<ThemeGalleryProps> = ({ theme }) => (
  <section id="themes" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
    <div className="mb-6 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mb-2">13 themes, light and dark</h2>
      <p className="text-slate-400 max-w-xl mx-auto">
        Every theme below is real &mdash; picking one applies it to this whole page. Use the sun/moon toggle in the header
        to flip the current theme&rsquo;s light and dark variants.
      </p>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {theme.themes.map((info) => {
        const preview = getThemePreview(info, theme.mode);
        const isActive = theme.theme === info.id;
        return (
          <button
            key={info.id}
            type="button"
            onClick={() => theme.setTheme(info.id as ThemeId)}
            aria-pressed={isActive}
            className={`relative text-left rounded-xl border p-3 transition-all cursor-pointer ${
              isActive
                ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-indigo-950/30'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
            }`}
          >
            {isActive ? (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                <Check size={12} className="text-white" />
              </span>
            ) : null}
            <div className="flex gap-1 mb-2.5 rounded-lg overflow-hidden h-8 border" style={{ borderColor: preview.border }}>
              <span className="flex-1" style={{ backgroundColor: preview.bg }} />
              <span className="flex-1" style={{ backgroundColor: preview.surface }} />
              <span className="flex-1" style={{ backgroundColor: preview.accent }} />
            </div>
            <div className="text-sm font-semibold text-slate-100 truncate">{info.name}</div>
            <div className="text-[11px] font-mono text-slate-500 truncate">{info.authorOrOrigin}</div>
          </button>
        );
      })}
    </div>
  </section>
);
