import React from 'react';
import { KanbanBoard } from '../../../frontend/src/components/board/KanbanBoard.js';
import type { DemoWorkspace } from '../demo/useDemoWorkspace.js';

interface BoardDemoProps {
  workspace: DemoWorkspace;
}

/**
 * The actual product board (frontend/src/components/board/KanbanBoard.tsx),
 * unmodified apart from the opt-in heightClassName prop, driven by local
 * React state instead of the CRDT store. Drag a card between lanes -- it is
 * the same component, the same WIP pills, the same keyboard drag support.
 */
export const BoardDemo: React.FC<BoardDemoProps> = ({ workspace }) => (
  <section id="board" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
    <div className="mb-6 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mb-2">The real board</h2>
      <p className="text-slate-400 max-w-xl mx-auto">
        This is Lanekeeper&rsquo;s actual <code className="font-mono text-indigo-300">KanbanBoard</code> component,
        the Software Engineering workflow template, and the app&rsquo;s own sample tasks. Drag a card, or pick one up
        with the keyboard (Tab, then Space, then the arrow keys).
      </p>
    </div>
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
      <KanbanBoard
        lanes={workspace.lanes}
        tasks={workspace.tasks}
        onSelectTask={workspace.selectTask}
        onToggleTimer={workspace.toggleTimer}
        onMoveTask={workspace.moveTask}
        onAddTask={workspace.addTask}
        onArchiveCompletedTasks={workspace.archiveCompletedTasks}
        heightClassName="h-[34rem]"
      />
    </div>
  </section>
);
