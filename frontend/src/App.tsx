import { useState, useEffect } from 'react';
import { useCrdt } from './hooks/useCrdt.js';
import { useWebPush } from './hooks/useWebPush.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { getStoredAuthSession, saveAuthSession } from './auth/cognito.js';
import { scheduleSync } from './crdt/sync.js';

import { Header } from './components/layout/Header.js';
import { KanbanBoard } from './components/board/KanbanBoard.js';
import { FlightDeckView } from './components/flightdeck/FlightDeckView.js';
import { QuickCaptureModal } from './components/capture/QuickCaptureModal.js';
import { TaskDetailDrawer } from './components/task/TaskDetailDrawer.js';
import { HelpModal } from './components/layout/HelpModal.js';
import { AuthModal } from './components/auth/AuthModal.js';
import type { Task, AuthSession } from './types/index.js';

export function App() {
  const {
    tasks,
    lanes,
    metadata,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    toggleSubtask,
    addSubtask,
    promoteSubtaskToTask,
    toggleTimer
  } = useCrdt();

  const [activeView, setActiveView] = useState<'board' | 'flightdeck'>('board');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(getStoredAuthSession);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { isSubscribed, requestAndSubscribe } = useWebPush(
    import.meta.env.VITE_API_URL,
    authSession?.accessToken
  );

  // Sync online/offline network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (import.meta.env.VITE_API_URL && authSession?.accessToken) {
        scheduleSync(import.meta.env.VITE_API_URL, authSession.accessToken, 100);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [authSession]);

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
      setSelectedTask(null);
    },
    onToggleHelp: () => setIsHelpOpen((h) => !h)
  });

  const handleQuickTaskSubmit = (taskData: any) => {
    addTask(taskData);
    if (import.meta.env.VITE_API_URL && authSession?.accessToken) {
      scheduleSync(import.meta.env.VITE_API_URL, authSession.accessToken);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* App Header */}
      <Header
        metadata={metadata}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        isOnline={isOnline}
        pushSubscribed={isSubscribed}
        onTogglePush={requestAndSubscribe}
      />

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeView === 'board' ? (
          <KanbanBoard
            lanes={lanes}
            tasks={tasks}
            onSelectTask={(task) => setSelectedTask(task)}
            onToggleTimer={toggleTimer}
            onMoveTask={moveTask}
            onAddTask={(laneId, title) => addTask({ laneId, title })}
          />
        ) : (
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
        onToggleTimer={toggleTimer}
        onToggleSubtask={toggleSubtask}
        onAddSubtask={addSubtask}
        onPromoteSubtask={(parentTaskId, subtaskId) => {
          const child = promoteSubtaskToTask(parentTaskId, subtaskId);
          if (child) {
            setSelectedTask(child);
          }
        }}
      />

      {/* Keyboard Shortcuts & Syntax Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Cognito TOTP MFA Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSessionChange={(session) => {
          setAuthSession(session);
          saveAuthSession(session);
        }}
      />
    </div>
  );
}

export default App;
