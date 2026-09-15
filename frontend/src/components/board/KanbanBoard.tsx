import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
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
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  lanes,
  tasks,
  onSelectTask,
  onToggleTimer,
  onMoveTask,
  onAddTask,
  onArchiveCompletedTasks
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

  const sensors = useSensors(pointerSensor, touchSensor);

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
    >
      <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
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
            const laneTasks = sortTasksByRank(filteredTasks.filter((t) => t.laneId === lane.id));
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
