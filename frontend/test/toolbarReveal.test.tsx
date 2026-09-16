import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  getStoredToolbarRevealMode,
  saveToolbarRevealMode,
  TOOLBAR_REVEAL_STORAGE_KEY,
  TOOLBAR_REVEAL_CHANGE_EVENT,
  useHoverReveal,
  HoverRevealController
} from '../src/hooks/useToolbarPreferences.js';
import { Header } from '../src/components/layout/Header.js';
import { AppSettingsModal } from '../src/components/settings/AppSettingsModal.js';
import { FeatureGateProvider } from '../src/features/index.js';
import type { ProjectMetadata, UserProfile } from '../src/types/index.js';

const mockProfile: UserProfile = {
  id: 'usr-1',
  email: 'michaelsanford@users.noreply.github.com',
  displayName: 'Michael Sanford',
  gitAuthorName: 'Michael Sanford',
  gitAuthorEmail: 'michaelsanford@users.noreply.github.com',
  defaultAssigneeHandle: 'michaelsanford',
  dailyFocusTargetMinutes: 240,
  mfaEnabled: false,
  provider: 'local',
  cliToken: 'lk_dev_seed_token'
};

const mockMetadata: ProjectMetadata = {
  id: 'proj-1',
  name: 'Core Platform',
  prefix: 'CORE',
  templateId: 'kanban-basic',
  swimlaneField: 'priority',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

describe('Toolbar Slide Reveal Architecture & Preferences', () => {
  let originalLocalStorage: any;
  let originalWindow: any;
  const storageMap = new Map<string, string>();

  beforeEach(() => {
    vi.restoreAllMocks();
    storageMap.clear();
    originalLocalStorage = (globalThis as any).localStorage;
    (globalThis as any).localStorage = {
      getItem: (k: string) => storageMap.get(k) || null,
      setItem: (k: string, v: string) => storageMap.set(k, String(v)),
      removeItem: (k: string) => storageMap.delete(k),
      clear: () => storageMap.clear(),
      get length() { return storageMap.size; },
      key: (i: number) => Array.from(storageMap.keys())[i] || null
    };

    originalWindow = (globalThis as any).window;
    const target = new EventTarget();
    (globalThis as any).window = {
      addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target),
      dispatchEvent: target.dispatchEvent.bind(target)
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalLocalStorage !== undefined) {
      (globalThis as any).localStorage = originalLocalStorage;
    } else {
      delete (globalThis as any).localStorage;
    }
    if (originalWindow !== undefined) {
      (globalThis as any).window = originalWindow;
    } else {
      delete (globalThis as any).window;
    }
  });

  describe('Preference Storage & Events', () => {
    it('defaults to balanced mode when localStorage is empty', () => {
      const mode = getStoredToolbarRevealMode();
      expect(mode).toBe('balanced');
    });

    it('saves and dispatches toolbar reveal change events', () => {
      const listener = vi.fn();
      window.addEventListener(TOOLBAR_REVEAL_CHANGE_EVENT, listener);

      saveToolbarRevealMode('zen');
      expect(listener).toHaveBeenCalled();
      expect(getStoredToolbarRevealMode()).toBe('zen');

      window.removeEventListener(TOOLBAR_REVEAL_CHANGE_EVENT, listener);
    });

    it('initializes useHoverReveal with isRevealed false and provides event binders', () => {
      let captured: any;
      const HookTester = () => {
        captured = useHoverReveal({ holdDelayMs: 1000 });
        return <div>{captured.isRevealed ? 'REVEALED' : 'COLLAPSED'}</div>;
      };

      const html = renderToString(<HookTester />);
      expect(html).toContain('COLLAPSED');
      expect(captured).toBeDefined();
      expect(captured.isRevealed).toBe(false);
      expect(typeof captured.bind.onMouseEnter).toBe('function');
      expect(typeof captured.bind.onMouseLeave).toBe('function');
      expect(typeof captured.bind.onFocus).toBe('function');
      expect(typeof captured.bind.onBlur).toBe('function');
      expect(typeof captured.closeImmediate).toBe('function');
    });

    it('holds items open for at least 1 second after cursor exit without interruption', () => {
      vi.useFakeTimers();

      const onChange = vi.fn();
      const controller = new HoverRevealController({ holdDelayMs: 1000, onChange });
      expect(controller.isRevealed).toBe(false);

      // Simulate mouse enter
      controller.handleMouseEnter();
      expect(controller.isRevealed).toBe(true);
      expect(onChange).toHaveBeenLastCalledWith(true);

      // Simulate mouse exit after short duration
      controller.handleMouseLeave();

      // Immediately after cursor leaves, item remains open (uninterruptible)
      expect(controller.isRevealed).toBe(true);

      // Remains open after 500ms
      vi.advanceTimersByTime(500);
      expect(controller.isRevealed).toBe(true);

      // Remains open after 999ms
      vi.advanceTimersByTime(499);
      expect(controller.isRevealed).toBe(true);

      // After 1000ms from exit, closes
      vi.advanceTimersByTime(1);
      expect(controller.isRevealed).toBe(false);
      expect(onChange).toHaveBeenLastCalledWith(false);

      // Test re-entering before 1000ms cancels closing
      controller.handleMouseEnter();
      expect(controller.isRevealed).toBe(true);
      controller.handleMouseLeave();
      vi.advanceTimersByTime(600);
      expect(controller.isRevealed).toBe(true);
      // Re-enter cursor
      controller.handleMouseEnter();
      // Even if another 600ms passes, it remains open because re-entering cancelled timer
      vi.advanceTimersByTime(600);
      expect(controller.isRevealed).toBe(true);

      // Test closeImmediate
      controller.closeImmediate();
      expect(controller.isRevealed).toBe(false);

      controller.dispose();
      vi.useRealTimers();
    });
  });

  describe('Header Rendering by Reveal Mode', () => {
    it('renders balanced mode with anchored active view and slide-out inactive views', () => {
      const html = renderToString(
        <Header
          metadata={mockMetadata}
          activeView="board"
          onViewChange={vi.fn()}
          onOpenQuickCapture={vi.fn()}
          onOpenHelp={vi.fn()}
          onOpenProjectSettings={vi.fn()}
          onOpenAppSettings={vi.fn()}
          revealMode="balanced"
          pushSubscribed={false}
          onTogglePush={vi.fn()}
        />
      );

      // Project Name is anchored and visible (not collapsed to max-w-0)
      expect(html).toContain('Core Platform');
      expect(html).not.toContain('group-hover/proj:max-w-[320px]');

      // Active view (Board) has its label visible
      expect(html).toContain('Board');

      // Inactive views (Table, Calendar, Flight Deck) have slide-reveal classes
      expect(html).toContain('group-hover/view-btn:max-w-[100px]');
      expect(html).toContain('duration-500 ease-in-out');

      // Quick capture is compact and slides out on hover
      expect(html).toContain('group-hover/capture:max-w-[110px]');

      // Brand has slide-reveal classes
      expect(html).toContain('group-hover:max-w-[120px]');

      // Status badges have slide-reveal classes
      expect(html).toContain('group-hover/badge:max-w-[140px]');
      expect(html).toContain('group-hover/notify:max-w-[140px]');
    });

    it('renders zen mode with collapsed project name and all view labels sliding out', () => {
      const html = renderToString(
        <Header
          metadata={mockMetadata}
          activeView="board"
          onViewChange={vi.fn()}
          onOpenQuickCapture={vi.fn()}
          onOpenHelp={vi.fn()}
          onOpenProjectSettings={vi.fn()}
          onOpenAppSettings={vi.fn()}
          revealMode="zen"
          pushSubscribed={false}
          onTogglePush={vi.fn()}
        />
      );

      // Project name collapses at rest and slides out on hover
      expect(html).toContain('group-hover/proj:max-w-[320px]');
      expect(html).toContain('duration-500 ease-in-out');

      // Quick capture is compact and slides out on hover
      expect(html).toContain('group-hover/capture:max-w-[110px]');

      // View buttons have slide-reveal classes
      expect(html).toContain('group-hover/view-btn:max-w-[100px]');
    });

    it('renders expanded mode with static labels and no slide-out classes', () => {
      const html = renderToString(
        <Header
          metadata={mockMetadata}
          activeView="board"
          onViewChange={vi.fn()}
          onOpenQuickCapture={vi.fn()}
          onOpenHelp={vi.fn()}
          onOpenProjectSettings={vi.fn()}
          onOpenAppSettings={vi.fn()}
          revealMode="expanded"
          pushSubscribed={false}
          onTogglePush={vi.fn()}
        />
      );

      // Brand text is statically visible
      expect(html).toContain('max-w-[120px] opacity-100 ml-2.5');

      // Project Name is statically visible
      expect(html).toContain('Core Platform');
      expect(html).not.toContain('group-hover/proj:max-w-[320px]');

      // View labels use standard responsive display classes
      expect(html).toContain('hidden md:inline font-medium');

      // Quick capture is fully expanded with px-3.5
      expect(html).toContain('px-3.5');
      expect(html).not.toContain('group-hover/capture:max-w-[110px]');
    });
  });

  describe('Settings Modal Toolbar Density Controls', () => {
    it('renders Toolbar Density & Slide Reveal controls above colour schemes in themes tab', () => {
      const onSelectRevealMode = vi.fn();

      const html = renderToString(
        <FeatureGateProvider>
          <AppSettingsModal
            isOpen={true}
            onClose={vi.fn()}
            currentTheme="lanekeeper"
            currentMode="dark"
            onSelectTheme={vi.fn()}
            onSelectMode={vi.fn()}
            initialTab="themes"
            profile={mockProfile}
            revealMode="balanced"
            onSelectRevealMode={onSelectRevealMode}
          />
        </FeatureGateProvider>
      );

      expect(html).toContain('Toolbar Density &amp; Slide Reveal');
      expect(html).toContain('Balanced (Default)');
      expect(html).toContain('Zen / Minimalist');
      expect(html).toContain('Always Expanded');
      expect(html).toContain('Active');

      // Verify Toolbar Density is positioned before Coding Colour Schemes
      const densityIndex = html.indexOf('Toolbar Density &amp; Slide Reveal');
      const colourSchemesIndex = html.indexOf('Coding Colour Schemes');
      expect(densityIndex).toBeGreaterThan(-1);
      expect(colourSchemesIndex).toBeGreaterThan(-1);
      expect(densityIndex).toBeLessThan(colourSchemesIndex);
    });
  });
});
