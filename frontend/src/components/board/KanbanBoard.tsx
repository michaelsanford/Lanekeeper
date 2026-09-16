import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type Announcements
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Lane, Task, TaskPriority } from '../../types/index.js';
import { LaneColumn } from './LaneColumn.js';
import { TaskCard } from './TaskCard.js';
import { BoardFilterBar } from './BoardFilterBar.js';
import { getRankBetween, sortTasksByRank } from '../../utils/rank.js';

interface KanbanBoardProps {
  lanes: Lane[];
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onToggleTimer: (taskId: string) => void;
  onMoveTask: (taskId: string, targetLaneId: string, newRank: string) => void;
  onAddTask: (laneId: string, title: string) => void;
  onArchiveCompletedTasks?: (olderThanDays: number) => number;
  /** Overrides the default full-viewport board height (e.g. for embedding the board elsewhere). */
  heightClassName?: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  lanes,
  tasks,
  onSelectTask,
  onToggleTimer,
  onMoveTask,
  onAddTask,
  onArchiveCompletedTasks,
  heightClassName
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [onlyBlocked, setOnlyBlocked] = useState(false);

  // Filter out archived tasks on the board
  const activeTasks = useMemo(() => tasks.filter((t) => !t.archived), [tasks]);

  // Extract all unique tags
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    for (const t of activeTasks) {
      for (const tag of t.tags) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  }, [activeTasks]);

  // Count blocked active tasks
  const blockedCount = useMemo(
    () => activeTasks.filter((t) => t.isBlocked).length,
    [activeTasks]
  );

  // Apply filters to active tasks
  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return activeTasks.filter((t) => {
      if (onlyBlocked && !t.isBlocked) {
        return false;
      }
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
        return false;
      }
      if (selectedTag !== 'all' && !t.tags.includes(selectedTag)) {
        return false;
      }
      if (query) {
        const matchKey = t.key.toLowerCase().includes(query);
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchTag = t.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchKey && !matchTitle && !matchTag) {
          return false;
        }
      }
      return true;
    });
  }, [activeTasks, searchQuery, selectedPriority, selectedTag, onlyBlocked]);

  const handleCopyMarkdown = () => {
    let md = `# Board Tasks Summary\n\n`;
    for (const lane of lanes) {
      const laneTasks = sortTasksByRank(filteredTasks.filter((t) => t.laneId === lane.id));
      if (laneTasks.length === 0) continue;
      md += `### ${lane.name} (${laneTasks.length})\n`;
      for (const t of laneTasks) {
        const typeStr = t.kind && t.kind !== 'task' ? ` [${t.kind.toUpperCase()}]` : '';
        const priorityStr = t.priority !== 'none' ? ` [${t.priority.toUpperCase()}]` : '';
        const blockedStr = t.isBlocked ? ` (BLOCKED: ${t.blockedReason || 'yes'})` : '';
        const tagsStr = t.tags.length > 0 ? ` ${t.tags.map((tag) => `#${tag}`).join(' ')}` : '';
        md += `- **${t.key}**: ${t.title}${typeStr}${priorityStr}${blockedStr}${tagsStr}\n`;
      }
      md += `\n`;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(md.trim());
    }
  };

  // Configure sensors for smooth desktop & touch mobile interaction
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5
    }
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5
    }
  });

  // Enables moving a task between/within lanes from the keyboard: Tab to a
  // card, Space to pick it up, Arrow keys to move, Space again to drop,
  // Escape to cancel. Without this, drag-and-drop reordering was reachable
  // only with a pointer.
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  });

  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  const laneNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const lane of lanes) map.set(lane.id, lane.name);
    return map;
  }, [lanes]);

  // Custom screen-reader announcements naming the actual task and lane,
  // instead of dnd-kit's generic id-only defaults.
  const announcements: Announcements = useMemo(() => {
    const laneNameForDropTarget = (overId: string): string | undefined => {
      if (laneNameById.has(overId)) return laneNameById.get(overId);
      const overTask = tasks.find((t) => t.id === overId);
      return overTask ? laneNameById.get(overTask.laneId) : undefined;
    };

    return {
      onDragStart({ active }) {
        const task = tasks.find((t) => t.id === active.id);
        return task ? `Picked up task ${task.key}: ${task.title}.` : undefined;
      },
      onDragOver({ active, over }) {
        if (!over) return undefined;
        const task = tasks.find((t) => t.id === active.id);
        if (!task) return undefined;
        const laneName = laneNameForDropTarget(String(over.id));
        return laneName
          ? `Task ${task.key} is over the ${laneName} lane.`
          : `Task ${task.key} is over a new position.`;
      },
      onDragEnd({ active, over }) {
        const task = tasks.find((t) => t.id === active.id);
        if (!task) return undefined;
        if (!over) return `Movement of task ${task.key} was cancelled.`;
        const laneName = laneNameForDropTarget(String(over.id));
        return laneName ? `Task ${task.key} was moved to the ${laneName} lane.` : `Task ${task.key} was moved.`;
      },
      onDragCancel({ active }) {
        const task = tasks.find((t) => t.id === active.id);
        return task ? `Movement of task ${task.key} was cancelled.` : undefined;
      }
    };
  }, [tasks, laneNameById]);

  const tasksByLaneId = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const lane of lanes) {
      map.set(lane.id, sortTasksByRank(filteredTasks.filter((t) => t.laneId === lane.id)));
    }
    return map;
  }, [lanes, filteredTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find((t) => t.id === activeId);
    if (!task) return;

    // Check if dropped directly onto a lane column
    const targetLane = lanes.find((l) => l.id === overId);
    if (targetLane) {
      const targetLaneTasks = sortTasksByRank(tasks.filter((t) => t.laneId === targetLane.id));
      if (task.laneId !== targetLane.id) {
        const lastTask = targetLaneTasks[targetLaneTasks.length - 1];
        const newRank = getRankBetween(lastTask?.rank, undefined);
        onMoveTask(task.id, targetLane.id, newRank);
      } else {
        // Dropped onto empty area of its own lane column
        const lastTask = targetLaneTasks[targetLaneTasks.length - 1];
        if (lastTask && lastTask.id !== task.id) {
          const newRank = getRankBetween(lastTask.rank, undefined);
          onMoveTask(task.id, targetLane.id, newRank);
        }
      }
      return;
    }

    // Dropped onto another task card
    const targetTask = tasks.find((t) => t.id === overId);
    if (targetTask && activeId !== overId) {
      if (task.laneId === targetTask.laneId) {
        // Moving within the same swimlane
        const currentLaneTasks = sortTasksByRank(tasks.filter((t) => t.laneId === task.laneId));
        const oldIndex = currentLaneTasks.findIndex((t) => t.id === activeId);
        const overIndex = currentLaneTasks.findIndex((t) => t.id === overId);
        if (oldIndex !== -1 && overIndex !== -1 && oldIndex !== overIndex) {
          const reordered = arrayMove(currentLaneTasks, oldIndex, overIndex);
          const prevTask = overIndex > 0 ? reordered[overIndex - 1] : undefined;
          const nextTask = overIndex < reordered.length - 1 ? reordered[overIndex + 1] : undefined;
          const newRank = getRankBetween(prevTask?.rank, nextTask?.rank);
          onMoveTask(task.id, task.laneId, newRank);
        }
      } else {
        // Moving across swimlanes onto a card in the target swimlane
        const targetLaneTasks = sortTasksByRank(tasks.filter((t) => t.laneId === targetTask.laneId));
        const overIndex = targetLaneTasks.findIndex((t) => t.id === overId);
        if (overIndex !== -1) {
          const prevTask = overIndex > 0 ? targetLaneTasks[overIndex - 1] : undefined;
          const nextTask = targetLaneTasks[overIndex];
          const newRank = getRankBetween(prevTask?.rank, nextTask?.rank);
          onMoveTask(task.id, targetTask.laneId, newRank);
        } else {
          const lastTask = targetLaneTasks[targetLaneTasks.length - 1];
          const newRank = getRankBetween(lastTask?.rank, undefined);
          onMoveTask(task.id, targetTask.laneId, newRank);
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements }}
    >
      <div className={`flex-1 flex flex-col ${heightClassName ?? 'h-[calc(100vh-3.5rem)]'} overflow-hidden`}>
        {/* Board Search & Filter Bar (Feature 1 - Always On) */}
        <BoardFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          onlyBlocked={onlyBlocked}
          onToggleOnlyBlocked={() => setOnlyBlocked((b) => !b)}
          blockedCount={blockedCount}
          availableTags={availableTags}
          totalCount={activeTasks.length}
          filteredCount={filteredTasks.length}
          onCopyMarkdown={handleCopyMarkdown}
          onResetFilters={() => {
            setSearchQuery('');
            setSelectedPriority('all');
            setSelectedTag('all');
            setOnlyBlocked(false);
          }}
        />

        {/* Swimlanes container */}
        <div className="flex-1 flex gap-4 p-4 pt-2 overflow-x-auto items-start">
          {lanes.map((lane) => {
            const laneTasks = tasksByLaneId.get(lane.id) ?? [];
            return (
              <LaneColumn
                key={lane.id}
                lane={lane}
                tasks={laneTasks}
                onSelectTask={onSelectTask}
                onToggleTimer={onToggleTimer}
                onAddTask={onAddTask}
                onArchiveCompletedTasks={onArchiveCompletedTasks}
              />
            );
          })}
        </div>
      </div>

      {/* Drag Overlay for smooth preview */}
      <DragOverlay>
        {activeTask ? (
          <div className="w-80 opacity-90 scale-105 rotate-2 pointer-events-none shadow-2xl">
            <TaskCard
              task={activeTask}
              onSelect={() => {}}
              onToggleTimer={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
