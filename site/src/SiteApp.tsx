import React, { useCallback } from 'react';
import { useTheme } from '../../frontend/src/hooks/useTheme.js';
import { useKeyboardShortcuts } from '../../frontend/src/hooks/useKeyboardShortcuts.js';
import { FeatureGateProvider } from '../../frontend/src/features/index.js';
import { TaskDetailDrawer } from '../../frontend/src/components/task/TaskDetailDrawer.js';
import { useDemoWorkspace } from './demo/useDemoWorkspace.js';
import { SiteHeader } from './components/SiteHeader.js';
import { Hero } from './components/Hero.js';
import { BoardDemo } from './components/BoardDemo.js';
import { CaptureDemo } from './components/CaptureDemo.js';
import { TerminalDemo } from './components/TerminalDemo.js';
import { ThemeGallery } from './components/ThemeGallery.js';
import { TemplateGallery } from './components/TemplateGallery.js';
import { FeatureGrid } from './components/FeatureGrid.js';
import { SiteFooter } from './components/SiteFooter.js';

const noop = () => {};

export const SiteApp: React.FC = () => {
  const theme = useTheme();
  const workspace = useDemoWorkspace();
  const closeDrawer = useCallback(() => workspace.selectTask(null), [workspace]);

  // Reuses the product's own Escape-to-close semantics for the task detail
  // drawer (ModalShell itself has no keyboard handling -- the app supplies it).
  useKeyboardShortcuts({
    onOpenQuickCapture: noop,
    onToggleFlightDeck: noop,
    onToggleHelp: noop,
    closeTargets: [{ isOpen: workspace.selectedTask !== null, onClose: closeDrawer }],
    isAnyModalOpen: workspace.selectedTask !== null
  });

  return (
    <FeatureGateProvider initialFlags={{ timeTracking: true }}>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        <SiteHeader theme={theme} />
        <Hero taskCount={workspace.tasks.length} />
        <BoardDemo workspace={workspace} />
        <CaptureDemo />
        <TerminalDemo workspace={workspace} />
        <ThemeGallery theme={theme} />
        <TemplateGallery />
        <FeatureGrid />
        <SiteFooter />

        <TaskDetailDrawer
          task={workspace.selectedTask}
          lanes={workspace.lanes}
          onClose={closeDrawer}
          onUpdateTask={workspace.updateTask}
          onDeleteTask={workspace.deleteTask}
          onDuplicateTask={(taskId) => {
            const dup = workspace.duplicateTask(taskId);
            if (dup) workspace.selectTask(dup);
          }}
          onToggleTimer={workspace.toggleTimer}
          onToggleSubtask={workspace.toggleSubtask}
          onAddSubtask={workspace.addSubtask}
          onPromoteSubtask={(parentTaskId, subtaskId) => {
            const child = workspace.promoteSubtaskToTask(parentTaskId, subtaskId);
            if (child) workspace.selectTask(child);
          }}
          onArchiveTask={workspace.archiveTask}
          onUnarchiveTask={workspace.unarchiveTask}
        />
      </div>
    </FeatureGateProvider>
  );
};
