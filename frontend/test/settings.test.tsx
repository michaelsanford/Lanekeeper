import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AppSettingsModal } from '../src/components/settings/AppSettingsModal.js';
import { ProjectSettingsModal } from '../src/components/project/ProjectSettingsModal.js';
import { Header } from '../src/components/layout/Header.js';
import { FeatureGateProvider } from '../src/features/index.js';
import type { ProjectMetadata, Lane } from '../src/types/index.js';

const mockMetadata: ProjectMetadata = {
  id: 'proj-1',
  name: 'Core Platform',
  prefix: 'CORE',
  keyCounter: 5,
  templateId: 'software'
};

const mockLanes: Lane[] = [
  { id: 'triage', name: 'Triage', color: '#64748b', wipLimit: 0 },
  { id: 'in_progress', name: 'In Progress', color: '#3b82f6', wipLimit: 3 },
  { id: 'done', name: 'Done', color: '#10b981', wipLimit: 0 }
];

describe('Settings Modals and Header Grouping', () => {
  it('renders AppSettingsModal with Theme & Feature Gates tabs', () => {
    const html = renderToString(
      <FeatureGateProvider>
        <AppSettingsModal
          isOpen={true}
          onClose={vi.fn()}
          currentTheme="dracula"
          currentMode="dark"
          onSelectTheme={vi.fn()}
          onSelectMode={vi.fn()}
          initialTab="themes"
        />
      </FeatureGateProvider>
    );

    expect(html).toContain('Preferences &amp; System Settings');
    expect(html).toContain('Theme &amp; Appearance');
    expect(html).toContain('Feature Gates');
    expect(html).toContain('Colour Schemes');
  });

  it('renders AppSettingsModal with Feature Gates tab active', () => {
    const html = renderToString(
      <FeatureGateProvider>
        <AppSettingsModal
          isOpen={true}
          onClose={vi.fn()}
          currentTheme="dracula"
          currentMode="dark"
          onSelectTheme={vi.fn()}
          onSelectMode={vi.fn()}
          initialTab="features"
        />
      </FeatureGateProvider>
    );

    expect(html).toContain('Experimental &amp; System Feature Gates');
    expect(html).toContain('Time Tracking &amp; Session Timers');
    expect(html).toContain('Done Lane Auto-Archive &amp; Clean Up');
  });

  it('renders ProjectSettingsModal with project-scoped tabs and without theme/features', () => {
    const html = renderToString(
      <ProjectSettingsModal
        isOpen={true}
        onClose={vi.fn()}
        metadata={mockMetadata}
        lanes={mockLanes}
        projectsList={[mockMetadata]}
        onUpdateMetadata={vi.fn()}
        onAddLane={vi.fn()}
        onUpdateLane={vi.fn()}
        onDeleteLane={vi.fn()}
        onCreateProject={vi.fn()}
        onSwitchProject={vi.fn()}
        initialTab="lanes"
      />
    );

    expect(html).toContain('Project Settings &amp; Configuration');
    expect(html).toContain('Workflow Lanes');
    expect(html).toContain('General &amp; Identifiers');
    expect(html).toContain('Switch / New Project');
    // Ensure Theme and Feature Gates were removed from ProjectSettingsModal
    expect(html).not.toContain('Colour Schemes');
    expect(html).not.toContain('Feature Gates &amp; Experiments');
  });

  it('renders Header without standalone theme dropdown and with preferences gear button', () => {
    const html = renderToString(
      <Header
        metadata={mockMetadata}
        activeView="board"
        onViewChange={vi.fn()}
        onOpenQuickCapture={vi.fn()}
        onOpenHelp={vi.fn()}
        onOpenProjectSettings={vi.fn()}
        onOpenAppSettings={vi.fn()}
        isOnline={true}
        pushSubscribed={false}
        onTogglePush={vi.fn()}
        projectsList={[mockMetadata]}
        onSwitchProject={vi.fn()}
      />
    );

    // Standalone theme button title removed
    expect(html).not.toContain('Colour Scheme / Theme');
    // Right pane preferences gear button present
    expect(html).toContain('Preferences &amp; Feature Gates (Themes &amp; Settings)');
    // Project name and prefix displayed prominently
    expect(html).toContain('Core Platform');
    expect(html).toContain('CORE');
  });
});
