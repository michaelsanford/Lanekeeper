import { useState, useEffect } from 'react';
import { useCrdt } from './hooks/useCrdt.js';
import { useWebPush } from './hooks/useWebPush.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { useTheme } from './hooks/useTheme.js';
import { getStoredAuthSession, saveAuthSession } from './auth/cognito.js';
import { scheduleSync, syncWithServer } from './crdt/sync.js';
import { useNetworkStatus } from './hooks/useNetworkStatus.js';
import { useToolbarPreferences } from './hooks/useToolbarPreferences.js';
import { FeatureGateProvider } from './features/index.js';

import { Header, type ActiveView } from './components/layout/Header.js';
import { KanbanBoard } from './components/board/KanbanBoard.js';
import { FlightDeckView } from './components/flightdeck/FlightDeckView.js';
import { TableView } from './components/table/TableView.js';
import { CalendarView } from './components/calendar/CalendarView.js';
import { QuickCaptureModal } from './components/capture/QuickCaptureModal.js';
import { TaskDetailDrawer } from './components/task/TaskDetailDrawer.js';
import { HelpModal } from './components/layout/HelpModal.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { ProjectSettingsModal } from './components/project/ProjectSettingsModal.js';
import { AppSettingsModal, type AppSettingsTab } from './components/settings/AppSettingsModal.js';
import { useUserProfile } from './hooks/useUserProfile.js';
import type { Task, AuthSession } from './types/index.js';

export function App() {
  const {
    tasks,
    lanes,
    metadata,
    addTask,
    duplicateTask,
    updateTask,
    deleteTask,
    moveTask,
    toggleSubtask,
    addSubtask,
    promoteSubtaskToTask,
    toggleTimer,
    updateMetadata,
    addLane,
    updateLane,
    deleteLane,
    getProjectsList,
    createProject,
    switchProject,
    applyWorkflowTemplate,
    seedSampleTasks,
    archiveTask,
    unarchiveTask,
    archiveCompletedTasks
  } = useCrdt();

  const [activeView, setActiveView] = useState<ActiveView>('board');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [projectSettingsTab, setProjectSettingsTab] = useState<'general' | 'lanes' | 'projects'>('lanes');
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);
  const [appSettingsTab, setAppSettingsTab] = useState<AppSettingsTab>('profile');
  const [authSession, setAuthSession] = useState<AuthSession | null>(getStoredAuthSession);

  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');
  const syncToken = authSession?.accessToken || (import.meta.env.DEV ? 'lk_dev_seed_token' : undefined);

  const { status: networkStatus, isOnline } = useNetworkStatus(apiUrl, syncToken);
  const { revealMode, setRevealMode } = useToolbarPreferences();
  const { profile, updateProfile, generateCliToken } = useUserProfile(authSession);
  const { theme, mode, setTheme, setMode } = useTheme();

  const { isSubscribed, requestAndSubscribe, permission } = useWebPush(
    apiUrl,
    syncToken
  );

  // Periodic background synchronization (3s in dev mode to immediately reflect CLI & seed actions)
  useEffect(() => {
    if (apiUrl && syncToken && isOnline) {
      syncWithServer(apiUrl, syncToken);
    }

    const pollIntervalMs = import.meta.env.DEV ? 3000 : 30000;
    const interval = setInterval(() => {
      if (apiUrl && syncToken && navigator.onLine) {
        syncWithServer(apiUrl, syncToken);
      }
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [apiUrl, syncToken, isOnline]);

  // Handle PWA Web Share Target and App Shortcuts jumplist on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const view = params.get('view');
    const taskKey = params.get('task');
    const sharedTitle = params.get('title') || params.get('text');

    if (action === 'quick-add' || sharedTitle) {
      setIsQuickCaptureOpen(true);
    }
    if (view === 'flight-deck') {
      setActiveView('flightdeck');
    }
    if (taskKey) {
      const match = tasks.find((t) => t.key === taskKey);
      if (match) setSelectedTask(match);
    }

    // Register service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }
  }, []);

  // Sync active selectedTask object when tasks array updates
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find((t) => t.id === selectedTask.id);
      if (updated) {
        setSelectedTask(updated);
      }
    }
  }, [tasks]);

  // Global Keyboard Shortcuts
  useKeyboardShortcuts({
    onOpenQuickCapture: () => setIsQuickCaptureOpen(true),
    onToggleFlightDeck: () =>
      setActiveView((v) => (v === 'board' ? 'flightdeck' : 'board')),
    onCloseModals: () => {
      setIsQuickCaptureOpen(false);
      setIsHelpOpen(false);
      setIsAuthOpen(false);
      setIsProjectSettingsOpen(false);
      setIsAppSettingsOpen(false);
      setSelectedTask(null);
    },
    onToggleHelp: () => setIsHelpOpen((h) => !h)
  });

  const handleQuickTaskSubmit = (taskData: any) => {
    addTask(taskData);
    if (apiUrl && syncToken) {
      scheduleSync(apiUrl, syncToken, 100);
    }
  };

  const handleCreateFromScratchpad = (rawText: string) => {
    addTask({
      title: rawText.split('\n')[0].slice(0, 80),
      description: rawText,
      priority: 'none',
      laneId: 'triage'
    });
  };

  const handleCompleteTask = (taskId: string) => {
    updateTask(taskId, {
      laneId: 'done',
      isTimerRunning: false
    });
  };

  return (
    <FeatureGateProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* App Header */}
      <Header
        metadata={metadata}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenProjectSettings={(tab) => {
          setProjectSettingsTab(tab || 'lanes');
          setIsProjectSettingsOpen(true);
        }}
        onOpenAppSettings={(tab) => {
          setAppSettingsTab(tab || 'profile');
          setIsAppSettingsOpen(true);
        }}
        isOnline={isOnline}
        networkStatus={networkStatus}
        revealMode={revealMode}
        pushSubscribed={isSubscribed}
        pushPermission={permission}
        onTogglePush={requestAndSubscribe}
        projectsList={getProjectsList()}
        onSwitchProject={(id, name, pfx) => switchProject(id, name, pfx)}
        profile={profile}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={() => {
          setAuthSession(null);
          saveAuthSession(null);
        }}
      />

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeView === 'board' && (
          <KanbanBoard
            lanes={lanes}
            tasks={tasks}
            onSelectTask={(task) => setSelectedTask(task)}
            onToggleTimer={toggleTimer}
            onMoveTask={moveTask}
            onAddTask={(laneId, title) => addTask({ laneId, title })}
            onArchiveCompletedTasks={archiveCompletedTasks}
          />
        )}
        {activeView === 'table' && (
          <TableView
            tasks={tasks}
            lanes={lanes}
            onSelectTask={(task) => setSelectedTask(task)}
            onToggleTimer={toggleTimer}
            onUpdateTask={updateTask}
            onAddTask={(taskData) => addTask(taskData)}
            onUnarchiveTask={unarchiveTask}
          />
        )}
        {activeView === 'calendar' && (
          <CalendarView
            tasks={tasks}
            lanes={lanes}
            onSelectTask={(task) => setSelectedTask(task)}
            onToggleTimer={toggleTimer}
            onAddTask={(taskData) => addTask(taskData)}
          />
        )}
        {activeView === 'flightdeck' && (
          <FlightDeckView
            tasks={tasks}
            onSelectTask={(task) => setSelectedTask(task)}
            onToggleTimer={toggleTimer}
            onCompleteTask={handleCompleteTask}
            onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            onCreateTaskFromScratchpad={handleCreateFromScratchpad}
          />
        )}
      </main>

      {/* Quick Task Ingestion Modal (Cmd+K / C) */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSubmitTask={handleQuickTaskSubmit}
      />

      {/* Slide-over Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        lanes={lanes}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        onDuplicateTask={(taskId) => {
          const dup = duplicateTask(taskId);
          if (dup) setSelectedTask(dup);
        }}
        onToggleTimer={toggleTimer}
        onToggleSubtask={toggleSubtask}
        onAddSubtask={addSubtask}
        onPromoteSubtask={(parentTaskId, subtaskId) => {
          const child = promoteSubtaskToTask(parentTaskId, subtaskId);
          if (child) {
            setSelectedTask(child);
          }
        }}
        onArchiveTask={archiveTask}
        onUnarchiveTask={unarchiveTask}
      />

      {/* Keyboard Shortcuts, Syntax & `lk` cli Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        profile={profile}
        onGenerateCliToken={generateCliToken}
      />

      {/* Cognito TOTP MFA Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSessionChange={(session) => {
          setAuthSession(session);
          saveAuthSession(session);
        }}
      />

      {/* Project & Workflow Lanes Settings Modal */}
      <ProjectSettingsModal
        isOpen={isProjectSettingsOpen}
        onClose={() => setIsProjectSettingsOpen(false)}
        metadata={metadata}
        lanes={lanes}
        projectsList={getProjectsList()}
        onUpdateMetadata={updateMetadata}
        onAddLane={addLane}
        onUpdateLane={updateLane}
        onDeleteLane={deleteLane}
        onCreateProject={createProject}
        onSwitchProject={(id, name, pfx) => {
          switchProject(id, name, pfx);
          setIsProjectSettingsOpen(false);
        }}
        onApplyTemplate={applyWorkflowTemplate}
        onSeedSampleTasks={seedSampleTasks}
        initialTab={projectSettingsTab}
      />

      {/* App Preferences & Feature Gates Modal (Theme & System) */}
      <AppSettingsModal
        isOpen={isAppSettingsOpen}
        onClose={() => setIsAppSettingsOpen(false)}
        currentTheme={theme}
        currentMode={mode}
        onSelectTheme={setTheme}
        onSelectMode={setMode}
        initialTab={appSettingsTab}
        profile={profile}
        networkStatus={networkStatus}
        isOnline={isOnline}
        revealMode={revealMode}
        onSelectRevealMode={setRevealMode}
        onUpdateProfile={updateProfile}
        onGenerateCliToken={generateCliToken}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />
    </div>
    </FeatureGateProvider>
  );
}

export default App;
