import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QuickCaptureModal } from '../src/components/capture/QuickCaptureModal.js';
import { AuthModal } from '../src/components/auth/AuthModal.js';
import { HelpModal } from '../src/components/layout/HelpModal.js';
import { LaneMarkerPickerModal } from '../src/components/project/LaneMarkerPickerModal.js';
import { ProjectSettingsModal } from '../src/components/project/ProjectSettingsModal.js';
import { AppSettingsModal } from '../src/components/settings/AppSettingsModal.js';
import { TaskDetailDrawer } from '../src/components/task/TaskDetailDrawer.js';
import type { Task, Lane, ProjectMetadata } from '../src/types/index.js';

const lanes: Lane[] = [{ id: 'triage', name: 'Triage', color: '#64748b', type: 'backlog' }];
const metadata: ProjectMetadata = { id: 'default', name: 'Lanekeeper Core', prefix: 'LK', templateId: 'software-dev' };
const task: Task = {
  id: 't1',
  key: 'LK-1',
  title: 'Sample task',
  description: '',
  priority: 'medium',
  laneId: 'triage',
  rank: '0|100:',
  tags: [],
  subtasks: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/** Extracts the `id="..."` value that `aria-labelledby="X"` points at, if present, and confirms an element with that id also exists. */
function assertDialogSemantics(html: string, label: string) {
  expect(html, `${label}: expected role="dialog"`).toContain('role="dialog"');
  expect(html, `${label}: expected aria-modal="true"`).toContain('aria-modal="true"');

  const labelledByMatch = html.match(/aria-labelledby="([^"]+)"/);
  const hasAriaLabel = /aria-label="[^"]+"/.test(html);
  expect(labelledByMatch || hasAriaLabel, `${label}: expected aria-labelledby or aria-label`).toBeTruthy();

  if (labelledByMatch) {
    const id = labelledByMatch[1];
    expect(html, `${label}: aria-labelledby="${id}" has no matching id="${id}"`).toContain(`id="${id}"`);
  }
}

describe('Modal accessibility: dialog semantics present on every modal', () => {
  it('QuickCaptureModal', () => {
    const html = renderToString(
      <QuickCaptureModal isOpen={true} onClose={vi.fn()} onSubmitTask={vi.fn()} />
    );
    assertDialogSemantics(html, 'QuickCaptureModal');
  });

  it('AuthModal', () => {
    const html = renderToString(<AuthModal isOpen={true} onClose={vi.fn()} onSessionChange={vi.fn()} />);
    assertDialogSemantics(html, 'AuthModal');
  });

  it('HelpModal', () => {
    const html = renderToString(<HelpModal isOpen={true} onClose={vi.fn()} />);
    assertDialogSemantics(html, 'HelpModal');
  });

  it('LaneMarkerPickerModal', () => {
    const html = renderToString(
      <LaneMarkerPickerModal
        isOpen={true}
        onClose={vi.fn()}
        laneColor="#6366f1"
        laneName="Triage"
        onSelectIcon={vi.fn()}
      />
    );
    assertDialogSemantics(html, 'LaneMarkerPickerModal');
  });

  it('ProjectSettingsModal', () => {
    const html = renderToString(
      <ProjectSettingsModal
        isOpen={true}
        onClose={vi.fn()}
        metadata={metadata}
        lanes={lanes}
        projectsList={[metadata]}
        onUpdateMetadata={vi.fn()}
        onAddLane={vi.fn()}
        onUpdateLane={vi.fn()}
        onDeleteLane={vi.fn()}
        onCreateProject={vi.fn()}
        onSwitchProject={vi.fn()}
      />
    );
    assertDialogSemantics(html, 'ProjectSettingsModal');
  });

  it('AppSettingsModal', () => {
    const html = renderToString(
      <AppSettingsModal
        isOpen={true}
        onClose={vi.fn()}
        currentTheme="lanekeeper"
        currentMode="dark"
        onSelectTheme={vi.fn()}
        onSelectMode={vi.fn()}
      />
    );
    assertDialogSemantics(html, 'AppSettingsModal');
  });

  it('TaskDetailDrawer', () => {
    const html = renderToString(
      <TaskDetailDrawer
        task={task}
        lanes={lanes}
        onClose={vi.fn()}
        onUpdateTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onToggleTimer={vi.fn()}
        onToggleSubtask={vi.fn()}
        onAddSubtask={vi.fn()}
        onPromoteSubtask={vi.fn()}
      />
    );
    assertDialogSemantics(html, 'TaskDetailDrawer');
  });

  it('modals render nothing (no dialog markup) when closed', () => {
    const html = renderToString(<QuickCaptureModal isOpen={false} onClose={vi.fn()} onSubmitTask={vi.fn()} />);
    expect(html).not.toContain('role="dialog"');
  });
});
